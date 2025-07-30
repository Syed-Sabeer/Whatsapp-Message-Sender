// In-memory database configuration for testing
// This can be used when MySQL is not available

const config = {
    // In-memory storage configuration
    memory: {
        enabled: true,
        maxSessions: 100,
        maxPhoneNumbersPerSession: 1000
    },
    
    // MySQL configuration (disabled for in-memory mode)
    mysql: {
        enabled: false,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'whatsapp_sender',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
    }
};

// Mock connection functions for in-memory mode
async function createConnectionPool() {
    console.log('⚠️  Using in-memory database mode (MySQL not available)');
    return null;
}

async function getConnection() {
    console.log('⚠️  In-memory mode - no database connection needed');
    return null;
}

async function closeConnection() {
    console.log('⚠️  In-memory mode - no connection to close');
}

module.exports = {
    config,
    createConnectionPool,
    getConnection,
    closeConnection
}; 