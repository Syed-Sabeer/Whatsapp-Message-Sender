const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.isInitializing = false;
        this.qrCodeData = null;
        this.logs = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.sessionPath = path.join(process.cwd(), 'sessions');
        this.ensureSessionDirectory();
    }

    ensureSessionDirectory() {
        if (!fs.existsSync(this.sessionPath)) {
            fs.mkdirSync(this.sessionPath, { recursive: true });
        }
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.unshift(logEntry);
        if (this.logs.length > 50) this.logs.pop();
        logger.info(logEntry);
    }

    async initializeClient() {
        if (this.isInitializing) {
            this.log('⚠️ Client initialization already in progress');
            return;
        }

        if (this.client && this.isConnected) {
            this.log('✅ Client already connected');
            return;
        }

        this.isInitializing = true;
        this.log('🚀 Initializing WhatsApp client...');

        try {
            // Destroy existing client if any
            if (this.client) {
                try {
                    await this.client.destroy();
                } catch (error) {
                    this.log(`⚠️ Error destroying existing client: ${error.message}`);
                }
            }

            this.client = new Client({
                authStrategy: new LocalAuth(),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                }
            });

            this.setupEventHandlers();
            
            // Add timeout for initialization
            const initTimeout = setTimeout(() => {
                if (this.isInitializing) {
                    this.log('⚠️ Initialization timeout - forcing completion');
                    this.isInitializing = false;
                }
            }, 30000); // 30 second timeout

            await this.client.initialize();
            
            clearTimeout(initTimeout);
            this.log('✅ Client initialization completed');
        } catch (error) {
            this.log(`❌ Failed to initialize client: ${error.message}`);
            this.isInitializing = false;
            this.isConnected = false;
            this.qrCodeData = null;
        }
    }

    setupEventHandlers() {
        this.client.on('qr', async (qr) => {
            this.log('📱 QR Code generated - scan to connect');
            try {
                this.qrCodeData = await QRCode.toDataURL(qr);
                this.isConnected = false;
                this.isInitializing = false; // Set to false when QR is ready
            } catch (error) {
                this.log(`❌ Error generating QR code: ${error.message}`);
            }
        });

        this.client.on('ready', () => {
            this.log('✅ WhatsApp client is ready and connected!');
            this.isConnected = true;
            this.isInitializing = false;
            this.qrCodeData = null;
            this.reconnectAttempts = 0;
        });

        this.client.on('authenticated', () => {
            this.log('🔐 WhatsApp authentication successful');
        });

        this.client.on('auth_failure', (msg) => {
            this.log(`❌ Authentication failed: ${msg}`);
            this.isConnected = false;
            this.isInitializing = false;
        });

        this.client.on('disconnected', (reason) => {
            this.log(`🔌 WhatsApp disconnected: ${reason}`);
            this.isConnected = false;
            this.isInitializing = false;
            this.handleDisconnection();
        });

        this.client.on('loading_screen', (percent, message) => {
            this.log(`📱 Loading: ${percent}% - ${message}`);
        });
    }

    async handleDisconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
                this.initializeClient();
            }, 5000);
        } else {
            this.log('❌ Max reconnection attempts reached. Please restart the server.');
        }
    }

    async sendMessage(phoneNumbers, message) {
        if (!this.isConnected) {
            throw new Error('WhatsApp client is not connected');
        }

        const results = [];
        const delay = parseInt(process.env.DEFAULT_MESSAGE_DELAY) || 1000;

        for (const phoneNumber of phoneNumbers) {
            try {
                const formattedNumber = this.formatPhoneNumber(phoneNumber);
                this.log(`📨 Sending message to ${phoneNumber} (formatted: ${formattedNumber})`);
                
                const chatId = `${formattedNumber}@c.us`;
                await this.client.sendMessage(chatId, message);

                results.push({
                    phoneNumber,
                    status: 'success',
                    timestamp: new Date()
                });

                this.log(`✅ Message sent successfully to ${phoneNumber}`);
                
                // Add delay between messages to avoid rate limiting
                await this.sleep(delay);

            } catch (error) {
                this.log(`❌ Failed to send message to ${phoneNumber}: ${error.message}`);
                results.push({
                    phoneNumber,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }

        return results;
    }

    formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // If it's already a 12-digit number (with country code), use as is
        if (cleaned.length === 12) {
            return cleaned;
        }
        
        // If it's a 10-digit number, add country code (assuming +91 for India)
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned;
        }
        
        // If it's 11 digits and starts with 0, remove the 0 and add country code
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            cleaned = '91' + cleaned.substring(1);
        }
        
        return cleaned;
    }

    getStatus() {
        return {
            connected: this.isConnected,
            initializing: this.isInitializing,
            qr: this.qrCodeData,
            logs: this.logs.slice(-10),
            reconnectAttempts: this.reconnectAttempts
        };
    }

    async reconnect() {
        if (this.isInitializing) {
            this.log('⚠️ Reconnection skipped - client already initializing');
            return;
        }
        
        this.log('🔄 Starting reconnection...');
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.qrCodeData = null;
        await this.initializeClient();
    }

    async destroy() {
        if (this.client) {
            try {
                await this.client.destroy();
                this.log('🔌 WhatsApp client destroyed');
            } catch (error) {
                this.log(`❌ Error destroying client: ${error.message}`);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = WhatsAppService; 