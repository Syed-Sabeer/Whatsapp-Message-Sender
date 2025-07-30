const express = require('express');
const SessionService = require('../services/SessionService');
const { logger } = require('../utils/logger');

const router = express.Router();
const sessionService = new SessionService();

// Send message to phone numbers
router.post('/send', async (req, res) => {
    try {
        const { sessionId, phoneNumbers, message } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            return res.status(400).json({
                error: 'Phone numbers array is required and must not be empty'
            });
        }

        if (!message || message.trim() === '') {
            return res.status(400).json({
                error: 'Message is required'
            });
        }

        const results = await sessionService.sendMessage(sessionId, phoneNumbers, message);
        
        res.json({
            success: true,
            data: {
                sessionId,
                message,
                results,
                totalSent: results.filter(r => r.status === 'success').length,
                totalFailed: results.filter(r => r.status === 'error').length
            }
        });
    } catch (error) {
        logger.error('Error sending message:', error);
        res.status(500).json({
            error: 'Failed to send message',
            message: error.message
        });
    }
});

// Send message to all numbers in a session
router.post('/send-to-session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({
                error: 'Message is required'
            });
        }

        const session = await sessionService.getSessionById(sessionId);
        if (!session) {
            return res.status(404).json({
                error: 'Session not found'
            });
        }

        if (session.phoneNumbers.length === 0) {
            return res.status(400).json({
                error: 'No phone numbers in session'
            });
        }

        const results = await sessionService.sendMessage(sessionId, session.phoneNumbers, message);
        
        res.json({
            success: true,
            data: {
                sessionId,
                message,
                results,
                totalSent: results.filter(r => r.status === 'success').length,
                totalFailed: results.filter(r => r.status === 'error').length
            }
        });
    } catch (error) {
        logger.error('Error sending message to session:', error);
        res.status(500).json({
            error: 'Failed to send message to session',
            message: error.message
        });
    }
});

// Get message history for a session
router.get('/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const messages = await sessionService.getMessageHistory(sessionId);
        
        res.json({
            success: true,
            data: {
                sessionId,
                messages
            }
        });
    } catch (error) {
        logger.error('Error getting message history:', error);
        res.status(500).json({
            error: 'Failed to get message history',
            message: error.message
        });
    }
});

// Get message statistics for a session
router.get('/stats/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const messages = await sessionService.getMessageHistory(sessionId);
        
        const stats = {
            totalMessages: messages.length,
            totalSent: messages.reduce((sum, msg) => sum + msg.totalSent, 0),
            totalFailed: messages.reduce((sum, msg) => sum + msg.totalFailed, 0),
            successRate: messages.length > 0 ? 
                (messages.reduce((sum, msg) => sum + msg.totalSent, 0) / 
                 messages.reduce((sum, msg) => sum + msg.totalSent + msg.totalFailed, 0) * 100).toFixed(2) : 0
        };
        
        res.json({
            success: true,
            data: {
                sessionId,
                stats
            }
        });
    } catch (error) {
        logger.error('Error getting message statistics:', error);
        res.status(500).json({
            error: 'Failed to get message statistics',
            message: error.message
        });
    }
});

module.exports = router; 