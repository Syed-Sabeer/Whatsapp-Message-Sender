const { logger } = require('../utils/logger');
const SessionRepository = require('../repositories/SessionRepository');
const WhatsAppService = require('./WhatsAppService');

class SessionService {
    constructor() {
        this.sessionRepository = new SessionRepository();
        this.whatsappService = new WhatsAppService();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            logger.info('SessionService already initialized');
            return;
        }
        
        try {
            await this.sessionRepository.initialize();
            await this.whatsappService.initializeClient();
            this.initialized = true;
            logger.info('SessionService initialized with single WhatsApp session');
        } catch (error) {
            logger.error('Error initializing SessionService:', error);
            throw error;
        }
    }

    async getStatus() {
        try {
            await this.initialize();
            const whatsappStatus = this.whatsappService.getStatus();
            
            return {
                connected: whatsappStatus.connected,
                initializing: whatsappStatus.initializing,
                qr: whatsappStatus.qr,
                logs: whatsappStatus.logs,
                reconnectAttempts: whatsappStatus.reconnectAttempts
            };
        } catch (error) {
            logger.error('Error getting status:', error);
            throw error;
        }
    }

    async sendMessage(phoneNumbers, message) {
        try {
            logger.info(`Starting to send message to ${phoneNumbers.length} numbers`);
            await this.initialize();
            
            // Send message via WhatsApp service
            logger.info(`Sending message via WhatsApp service`);
            const results = await this.whatsappService.sendMessage(phoneNumbers, message);
            
            // Calculate totals from results
            const totalSent = results.filter(r => r.status === 'success').length;
            const totalFailed = results.filter(r => r.status === 'error').length;
            
            // Store message in database
            const messageData = {
                phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers],
                message: message || '',
                results: results || [],
                totalSent: totalSent || 0,
                totalFailed: totalFailed || 0,
                timestamp: new Date()
            };
            
            await this.sessionRepository.addMessage('default', messageData);
            
            logger.info(`Message sent to ${phoneNumbers.length} numbers`);
            return results;
        } catch (error) {
            logger.error('Error in session service sending message:', error);
            throw error;
        }
    }

    async getMessageHistory() {
        try {
            await this.initialize();
            
            const messages = await this.sessionRepository.getMessages('default');
            
            // Ensure each message has proper totals calculated
            return messages.map(message => {
                // If message already has totals, use them
                if (message.totalSent !== undefined && message.totalFailed !== undefined) {
                    return message;
                }
                
                // Calculate totals from results if available
                if (message.results && Array.isArray(message.results)) {
                    const totalSent = message.results.filter(r => r.status === 'success').length;
                    const totalFailed = message.results.filter(r => r.status === 'error').length;
                    return {
                        ...message,
                        totalSent,
                        totalFailed
                    };
                }
                
                // Fallback to 0 if no results available
                return {
                    ...message,
                    totalSent: 0,
                    totalFailed: 1 // Assume failed if no results
                };
            });
        } catch (error) {
            logger.error('Error in session service getting message history:', error);
            throw error;
        }
    }

    async reconnect() {
        try {
            await this.whatsappService.reconnect();
            logger.info('WhatsApp session reconnected');
            return true;
        } catch (error) {
            logger.error('Error reconnecting WhatsApp session:', error);
            throw error;
        }
    }

    async destroy() {
        try {
            await this.whatsappService.destroy();
            await this.sessionRepository.close();
            logger.info('SessionService destroyed');
        } catch (error) {
            logger.error('Error destroying SessionService:', error);
        }
    }

    getDatabaseMode() {
        return this.sessionRepository.getDatabaseMode();
    }
}

module.exports = SessionService; 