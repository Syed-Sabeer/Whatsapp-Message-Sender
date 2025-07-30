const { logger } = require('./logger');
const fs = require('fs');
const path = require('path');

class InMemoryDatabaseManager {
    constructor() {
        this.sessions = new Map();
        this.phoneNumbers = new Map();
        this.messages = new Map();
        this.messageIdCounter = 1;
        this.dataDir = path.join(process.cwd(), 'data');
        this.sessionsFile = path.join(this.dataDir, 'sessions.json');
        this.phoneNumbersFile = path.join(this.dataDir, 'phone_numbers.json');
        this.messagesFile = path.join(this.dataDir, 'messages.json');
    }

    async initialize() {
        try {
            // Create data directory if it doesn't exist
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }

            // Load existing data from files
            await this.loadData();
            
            logger.info('Local storage database initialized successfully');
        } catch (error) {
            logger.error('Local storage database initialization error:', error);
            throw error;
        }
    }

    async loadData() {
        try {
            // Load sessions
            if (fs.existsSync(this.sessionsFile)) {
                const sessionsData = JSON.parse(fs.readFileSync(this.sessionsFile, 'utf8'));
                this.sessions = new Map(Object.entries(sessionsData));
                logger.info(`Loaded ${this.sessions.size} sessions from local storage`);
            }

            // Load phone numbers
            if (fs.existsSync(this.phoneNumbersFile)) {
                const phoneNumbersData = JSON.parse(fs.readFileSync(this.phoneNumbersFile, 'utf8'));
                this.phoneNumbers = new Map(Object.entries(phoneNumbersData));
            }

            // Load messages
            if (fs.existsSync(this.messagesFile)) {
                const messagesData = JSON.parse(fs.readFileSync(this.messagesFile, 'utf8'));
                this.messages = new Map(Object.entries(messagesData));
            }
        } catch (error) {
            logger.error('Error loading data from local storage:', error);
        }
    }

    async saveData() {
        try {
            // Save sessions
            const sessionsData = Object.fromEntries(this.sessions);
            fs.writeFileSync(this.sessionsFile, JSON.stringify(sessionsData, null, 2));

            // Save phone numbers
            const phoneNumbersData = Object.fromEntries(this.phoneNumbers);
            fs.writeFileSync(this.phoneNumbersFile, JSON.stringify(phoneNumbersData, null, 2));

            // Save messages
            const messagesData = Object.fromEntries(this.messages);
            fs.writeFileSync(this.messagesFile, JSON.stringify(messagesData, null, 2));

            logger.debug('Data saved to local storage');
        } catch (error) {
            logger.error('Error saving data to local storage:', error);
        }
    }

    async createTables() {
        // No tables needed for local storage
        logger.info('Local storage database tables created successfully');
    }

    async executeQuery(sql, params = []) {
        // Mock query execution for local storage mode
        logger.debug(`Local storage query executed: ${sql}`);
        return [];
    }

    async executeTransaction(queries) {
        // Mock transaction execution for local storage mode
        logger.debug(`Local storage transaction executed with ${queries.length} queries`);
    }

    async close() {
        // Save data before closing
        await this.saveData();
        
        // Clear in-memory data
        this.sessions.clear();
        this.phoneNumbers.clear();
        this.messages.clear();
        logger.info('Local storage database closed');
    }

    // Session operations
    async createSession(sessionId, name, phoneNumbers = [], messages = []) {
        const session = {
            id: sessionId,
            name,
            phoneNumbers,
            messages,
            isConnected: false,
            qrCode: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.sessions.set(sessionId, session);
        await this.saveData();
        return session;
    }

    async getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }

    async getAllSessions() {
        return Array.from(this.sessions.values());
    }

    async updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates, { updatedAt: new Date() });
            this.sessions.set(sessionId, session);
            await this.saveData();
        }
        return session;
    }

    async deleteSession(sessionId) {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            await this.saveData();
        }
        return deleted;
    }

    // Phone number operations
    async addPhoneNumber(sessionId, phoneNumber) {
        const session = this.sessions.get(sessionId);
        if (session && !session.phoneNumbers.includes(phoneNumber)) {
            session.phoneNumbers.push(phoneNumber);
            session.updatedAt = new Date();
            this.sessions.set(sessionId, session);
            await this.saveData();
        }
        return session;
    }

    async removePhoneNumber(sessionId, phoneNumber) {
        const session = this.sessions.get(sessionId);
        if (session) {
            const index = session.phoneNumbers.indexOf(phoneNumber);
            if (index > -1) {
                session.phoneNumbers.splice(index, 1);
                session.updatedAt = new Date();
                this.sessions.set(sessionId, session);
                await this.saveData();
            }
        }
        return session;
    }

    // Message operations
    async addMessage(sessionId, messageData) {
        const session = this.sessions.get(sessionId);
        if (session) {
            const message = {
                id: this.messageIdCounter++,
                sessionId,
                messageText: messageData.message,
                phoneNumbers: messageData.phoneNumbers,
                results: messageData.results,
                totalSent: messageData.results.filter(r => r.status === 'success').length,
                totalFailed: messageData.results.filter(r => r.status === 'error').length,
                timestamp: messageData.timestamp || new Date()
            };

            session.messages.push(message);
            session.updatedAt = new Date();
            this.sessions.set(sessionId, session);
            await this.saveData();
        }
        return session;
    }

    async getMessages(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? session.messages : [];
    }
}

module.exports = InMemoryDatabaseManager; 