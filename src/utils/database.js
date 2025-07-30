const { getConnection } = require('../config/database');
const { logger } = require('./logger');

class DatabaseManager {
    constructor() {
        this.connection = null;
    }

    async initialize() {
        try {
            this.connection = await getConnection();
            await this.createTables();
            logger.info('Database initialized successfully');
        } catch (error) {
            logger.error('Database initialization error:', error);
            throw error;
        }
    }

    async createTables() {
        const createSessionsTable = `
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone_numbers JSON DEFAULT '[]',
                messages JSON DEFAULT '[]',
                is_connected BOOLEAN DEFAULT FALSE,
                qr_code TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        const createPhoneNumbersTable = `
            CREATE TABLE IF NOT EXISTS phone_numbers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(50) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
                UNIQUE KEY unique_session_phone (session_id, phone_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        const createMessagesTable = `
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(50) NOT NULL,
                message_text TEXT NOT NULL,
                phone_numbers JSON NOT NULL,
                results JSON,
                total_sent INT DEFAULT 0,
                total_failed INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        try {
            await this.connection.execute(createSessionsTable);
            await this.connection.execute(createPhoneNumbersTable);
            await this.connection.execute(createMessagesTable);
            logger.info('Database tables created successfully');
        } catch (error) {
            logger.error('Error creating tables:', error);
            throw error;
        }
    }

    async executeQuery(sql, params = []) {
        try {
            const [rows] = await this.connection.execute(sql, params);
            return rows;
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }

    async executeTransaction(queries) {
        const connection = await this.connection.getConnection();
        try {
            await connection.beginTransaction();
            
            for (const query of queries) {
                await connection.execute(query.sql, query.params || []);
            }
            
            await connection.commit();
            connection.release();
        } catch (error) {
            await connection.rollback();
            connection.release();
            logger.error('Transaction error:', error);
            throw error;
        }
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }
}

module.exports = DatabaseManager; 