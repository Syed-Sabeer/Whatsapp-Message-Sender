const Session = require('../models/Session');
const DatabaseManager = require('../utils/database');
const { logger } = require('../utils/logger');

class SessionRepository {
    constructor() {
        this.dbManager = new DatabaseManager();
    }

    async initialize() {
        await this.dbManager.initialize();
    }

    async create(name, sessionId = null) {
        try {
            const id = sessionId || this.generateId();
            const session = new Session(id, name);
            
            const sql = `
                INSERT INTO sessions (id, name, phone_numbers, messages, is_connected, qr_code)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            await this.dbManager.executeQuery(sql, [
                session.id,
                session.name,
                JSON.stringify(session.phoneNumbers),
                JSON.stringify(session.messages),
                session.isConnected,
                session.qrCode
            ]);
            
            logger.info(`Session created: ${id}`);
            return session;
        } catch (error) {
            logger.error('Error creating session:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const sql = 'SELECT * FROM sessions WHERE id = ?';
            const rows = await this.dbManager.executeQuery(sql, [id]);
            
            if (rows.length === 0) {
                return null;
            }
            
            const row = rows[0];
            const session = new Session(
                row.id,
                row.name,
                JSON.parse(row.phone_numbers || '[]'),
                JSON.parse(row.messages || '[]')
            );
            
            session.createdAt = new Date(row.created_at);
            session.updatedAt = new Date(row.updated_at);
            session.isConnected = Boolean(row.is_connected);
            session.qrCode = row.qr_code;
            
            return session;
        } catch (error) {
            logger.error('Error finding session:', error);
            throw error;
        }
    }

    async findAll() {
        try {
            const sql = 'SELECT * FROM sessions ORDER BY created_at DESC';
            const rows = await this.dbManager.executeQuery(sql);
            
            return rows.map(row => {
                const session = new Session(
                    row.id,
                    row.name,
                    JSON.parse(row.phone_numbers || '[]'),
                    JSON.parse(row.messages || '[]')
                );
                
                session.createdAt = new Date(row.created_at);
                session.updatedAt = new Date(row.updated_at);
                session.isConnected = Boolean(row.is_connected);
                session.qrCode = row.qr_code;
                
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

            const sql = `
                UPDATE sessions 
                SET name = ?, phone_numbers = ?, messages = ?, is_connected = ?, qr_code = ?, updated_at = ?
                WHERE id = ?
            `;
            
            await this.dbManager.executeQuery(sql, [
                session.name,
                JSON.stringify(session.phoneNumbers),
                JSON.stringify(session.messages),
                session.isConnected,
                session.qrCode,
                session.updatedAt,
                session.id
            ]);
            
            logger.info(`Session updated: ${id}`);
            return session;
        } catch (error) {
            logger.error('Error updating session:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const sql = 'DELETE FROM sessions WHERE id = ?';
            const result = await this.dbManager.executeQuery(sql, [id]);
            
            if (result.affectedRows > 0) {
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

            // Add to phone_numbers table
            const phoneSql = `
                INSERT IGNORE INTO phone_numbers (session_id, phone_number)
                VALUES (?, ?)
            `;
            
            await this.dbManager.executeQuery(phoneSql, [id, phoneNumber]);
            
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

            // Remove from phone_numbers table
            const phoneSql = 'DELETE FROM phone_numbers WHERE session_id = ? AND phone_number = ?';
            await this.dbManager.executeQuery(phoneSql, [id, phoneNumber]);
            
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

            // Add to messages table
            const messageSql = `
                INSERT INTO messages (session_id, message_text, phone_numbers, results, total_sent, total_failed)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const totalSent = message.results ? message.results.filter(r => r.status === 'success').length : 0;
            const totalFailed = message.results ? message.results.filter(r => r.status === 'error').length : 0;
            
            await this.dbManager.executeQuery(messageSql, [
                sessionId,
                message.message,
                JSON.stringify(message.phoneNumbers),
                JSON.stringify(message.results || []),
                totalSent,
                totalFailed
            ]);
            
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
            const sql = 'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC';
            const rows = await this.dbManager.executeQuery(sql, [sessionId]);
            
            return rows.map(row => ({
                id: row.id,
                message: row.message_text,
                phoneNumbers: JSON.parse(row.phone_numbers),
                results: JSON.parse(row.results || '[]'),
                totalSent: row.total_sent,
                totalFailed: row.total_failed,
                timestamp: new Date(row.created_at)
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

module.exports = SessionRepository; 