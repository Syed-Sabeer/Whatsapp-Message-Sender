// MySQL database configuration
const mysql = require('mysql2/promise');

const config = {
    // MySQL configuration
    mysql: {
        enabled: true,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'whatsapp_sender',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
    },
    
    // In-memory storage configuration (fallback)
    memory: {
        enabled: false,
        maxSessions: 100,
        maxPhoneNumbersPerSession: 1000
    }
};

// Create connection pool
let pool = null;

async function createConnectionPool() {
    try {
        pool = mysql.createPool({
            host: config.mysql.host,
            port: config.mysql.port,
            user: config.mysql.user,
            password: config.mysql.password,
            database: config.mysql.database,
            connectionLimit: config.mysql.connectionLimit,
            acquireTimeout: config.mysql.acquireTimeout,
            timeout: config.mysql.timeout,
            reconnect: config.mysql.reconnect,
            waitForConnections: true,
            queueLimit: 0
        });

        // Test the connection
        const connection = await pool.getConnection();
        console.log('MySQL database connected successfully');
        connection.release();
        
        return pool;
    } catch (error) {
        console.error('MySQL connection error:', error);
        throw error;
    }
}

async function getConnection() {
    if (!pool) {
        pool = await createConnectionPool();
    }
    return pool;
}

async function closeConnection() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

module.exports = {
    config,
    createConnectionPool,
    getConnection,
    closeConnection
}; 