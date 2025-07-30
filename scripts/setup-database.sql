-- WhatsApp Sender Database Setup Script
-- Run this script in your MySQL client to create the database and user

-- Create database
CREATE DATABASE IF NOT EXISTS whatsapp_sender
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create user (change password as needed)
CREATE USER IF NOT EXISTS 'whatsapp_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON whatsapp_sender.* TO 'whatsapp_user'@'localhost';

-- Apply privileges
FLUSH PRIVILEGES;

-- Use the database
USE whatsapp_sender;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_numbers JSON DEFAULT '[]',
    messages JSON DEFAULT '[]',
    is_connected BOOLEAN DEFAULT FALSE,
    qr_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_is_connected (is_connected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS phone_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_phone (session_id, phone_number),
    INDEX idx_session_id (session_id),
    INDEX idx_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    phone_numbers JSON NOT NULL,
    results JSON,
    total_sent INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at),
    INDEX idx_total_sent (total_sent),
    INDEX idx_total_failed (total_failed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_sessions_name ON sessions(name);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at);

-- Show created tables
SHOW TABLES;

-- Show table structure
DESCRIBE sessions;
DESCRIBE phone_numbers;
DESCRIBE messages;

-- Insert sample data (optional)
INSERT INTO sessions (id, name, phone_numbers, messages, is_connected) VALUES
('sample_session_1', 'Sample Session 1', '[]', '[]', FALSE),
('sample_session_2', 'Sample Session 2', '[]', '[]', FALSE);

-- Show sample data
SELECT * FROM sessions;

-- Success message
SELECT 'Database setup completed successfully!' AS status; 