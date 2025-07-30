const Session = require('../models/Session');
const InMemoryDatabaseManager = require('../utils/database-inmemory');
const { logger } = require('../utils/logger');

class SessionRepositoryInMemory {
    constructor() {
        this.dbManager = new InMemoryDatabaseManager();
    }

    async initialize() {
        await this.dbManager.initialize();
    }

    async create(name, sessionId = null) {
        try {
            const id = sessionId || this.generateId();
            const session = new Session(id, name);
            
            // Create session in local storage
            await this.dbManager.createSession(id, name, [], []);
            
            logger.info(`Session created: ${id}`);
            return session;
        } catch (error) {
            logger.error('Error creating session:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const sessionData = await this.dbManager.getSession(id);
            
            if (!sessionData) {
                return null;
            }
            
            const session = new Session(
                sessionData.id,
                sessionData.name,
                sessionData.phoneNumbers || [],
                sessionData.messages || []
            );
            
            session.createdAt = new Date(sessionData.createdAt);
            session.updatedAt = new Date(sessionData.updatedAt);
            session.isConnected = Boolean(sessionData.isConnected);
            session.qrCode = sessionData.qrCode;
            
            return session;
        } catch (error) {
            logger.error('Error finding session:', error);
            throw error;
        }
    }

    async findAll() {
        try {
            const sessionsData = await this.dbManager.getAllSessions();
            
            return sessionsData.map(sessionData => {
                const session = new Session(
                    sessionData.id,
                    sessionData.name,
                    sessionData.phoneNumbers || [],
                    sessionData.messages || []
                );
                
                session.createdAt = new Date(sessionData.createdAt);
                session.updatedAt = new Date(sessionData.updatedAt);
                session.isConnected = Boolean(sessionData.isConnected);
                session.qrCode = sessionData.qrCode;
                
                return session;
            });
        } catch (error) {
            logger.error('Error finding all sessions:', error);
            throw error;
        }
    }

    async update(id, updates) {
        try {
            const session = await this.findById(id);
            if (!session) {
                throw new Error('Session not found');
            }

            // Update session properties
            Object.assign(session, updates);
            session.updatedAt = new Date();

            // Update in in-memory storage
            await this.dbManager.updateSession(id, {
                name: session.name,
                phoneNumbers: session.phoneNumbers,
                messages: session.messages,
                isConnected: session.isConnected,
                qrCode: session.qrCode,
                updatedAt: session.updatedAt
            });
            
            logger.info(`Session updated: ${id}`);
            return session;
        } catch (error) {
            logger.error('Error updating session:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const deleted = await this.dbManager.deleteSession(id);
            if (deleted) {
                logger.info(`Session deleted: ${id}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error deleting session:', error);
            throw error;
        }
    }

    async addPhoneNumber(id, phoneNumber) {
        try {
            const session = await this.findById(id);
            if (!session) {
                throw new Error('Session not found');
            }

            // Add phone number in in-memory storage
            await this.dbManager.addPhoneNumber(id, phoneNumber);
            
            // Update session phone_numbers array
            session.addPhoneNumber(phoneNumber);
            await this.update(id, { phoneNumbers: session.phoneNumbers });
            
            return session;
        } catch (error) {
            logger.error('Error adding phone number:', error);
            throw error;
        }
    }

    async removePhoneNumber(id, phoneNumber) {
        try {
            const session = await this.findById(id);
            if (!session) {
                throw new Error('Session not found');
            }

            // Remove phone number in in-memory storage
            await this.dbManager.removePhoneNumber(id, phoneNumber);
            
            // Update session phone_numbers array
            session.removePhoneNumber(phoneNumber);
            await this.update(id, { phoneNumbers: session.phoneNumbers });
            
            return session;
        } catch (error) {
            logger.error('Error removing phone number:', error);
            throw error;
        }
    }

    async addMessage(sessionId, message) {
        try {
            const session = await this.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Add message to in-memory storage
            await this.dbManager.addMessage(sessionId, message);
            
            // Update session messages array
            session.addMessage(message);
            await this.update(sessionId, { messages: session.messages });
            
            return session;
        } catch (error) {
            logger.error('Error adding message:', error);
            throw error;
        }
    }

    async getMessages(sessionId) {
        try {
            const messages = await this.dbManager.getMessages(sessionId);
            return messages.map(msg => ({
                id: msg.id,
                message: msg.message,
                phoneNumbers: msg.phoneNumbers,
                results: msg.results,
                totalSent: msg.totalSent,
                totalFailed: msg.totalFailed,
                timestamp: new Date(msg.timestamp)
            }));
        } catch (error) {
            logger.error('Error getting messages:', error);
            throw error;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async close() {
        await this.dbManager.close();
    }
}

module.exports = SessionRepositoryInMemory; 