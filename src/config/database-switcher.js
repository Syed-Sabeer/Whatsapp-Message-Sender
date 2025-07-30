const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

class DatabaseSwitcher {
    constructor() {
        this.mode = 'unknown';
    }

    async detectDatabaseMode() {
        try {
            // Check if MySQL is explicitly configured
            const hasMySQLConfig = process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER;
            
            if (!hasMySQLConfig) {
                logger.info('✅ No MySQL configuration found, using local storage mode');
                this.mode = 'memory';
                return 'memory';
            }

            // Try to connect to MySQL
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'whatsapp_sender',
                connectTimeout: 5000
            });
            
            await connection.end();
            this.mode = 'mysql';
            logger.info('✅ MySQL database detected and available');
            return 'mysql';
        } catch (error) {
            logger.warn('⚠️  MySQL not available, using local storage mode');
            logger.warn('   To use MySQL, please:');
            logger.warn('   1. Install MySQL server');
            logger.warn('   2. Create database: mysql -u root -p < scripts/setup-database.sql');
            logger.warn('   3. Update .env file with correct credentials');
            this.mode = 'memory';
            return 'memory';
        }
    }

    getDatabaseConfig() {
        if (this.mode === 'mysql') {
            return require('./database');
        } else {
            return require('./database-inmemory');
        }
    }

    getRepository() {
        if (this.mode === 'mysql') {
            return require('../repositories/SessionRepository');
        } else {
            return require('../repositories/SessionRepositoryInMemory');
        }
    }

    getMode() {
        return this.mode;
    }
}

module.exports = DatabaseSwitcher; 