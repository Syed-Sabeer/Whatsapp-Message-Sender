const express = require('express');
const SessionService = require('../services/SessionService');
const { logger } = require('../utils/logger');

const router = express.Router();
const sessionService = new SessionService();

// Get WhatsApp status
router.get('/status', async (req, res) => {
    try {
        const status = await sessionService.getStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('Error getting status:', error);
        res.status(500).json({
            error: 'Failed to get status',
            message: error.message
        });
    }
});

// Send message
router.post('/messages/send', async (req, res) => {
    try {
        const { phoneNumbers, message } = req.body;
        
        if (!phoneNumbers || !message) {
            return res.status(400).json({
                error: 'phoneNumbers and message are required'
            });
        }

        const results = await sessionService.sendMessage(phoneNumbers, message);
        
        res.json({
            success: true,
            data: results,
            message: 'Message sent successfully'
        });
    } catch (error) {
        logger.error('Error sending message:', error);
        res.status(500).json({
            error: 'Failed to send message',
            message: error.message
        });
    }
});

// Get message history
router.get('/messages/history', async (req, res) => {
    try {
        const messages = await sessionService.getMessageHistory();
        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        logger.error('Error getting message history:', error);
        res.status(500).json({
            error: 'Failed to get message history',
            message: error.message
        });
    }
});

// Reconnect WhatsApp
router.post('/reconnect', async (req, res) => {
    try {
        await sessionService.reconnect();
        res.json({
            success: true,
            message: 'Reconnection initiated'
        });
    } catch (error) {
        logger.error('Error reconnecting:', error);
        res.status(500).json({
            error: 'Failed to reconnect',
            message: error.message
        });
    }
});

module.exports = router; 