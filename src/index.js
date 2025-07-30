const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const sessionRoutes = require('./controllers/sessionController');
const messageRoutes = require('./controllers/messageController');
const SessionService = require('./services/SessionService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize session service
const sessionService = new SessionService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    try {
        await sessionService.close();
        logger.info('Application shutdown complete');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    try {
        await sessionService.close();
        logger.info('Application shutdown complete');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Open http://localhost:${PORT} in your browser`);
}); 