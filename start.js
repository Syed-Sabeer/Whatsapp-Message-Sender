const fs = require('fs');
const path = require('path');

console.log('🚀 Starting WhatsApp Sender...');

// Ensure .env file exists with correct port
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    const envContent = `PORT=3001
NODE_ENV=development
SESSION_PATH=./sessions
LOG_LEVEL=info
DEFAULT_MESSAGE_DELAY=1000
MAX_RETRY_ATTEMPTS=3
DB_HOST=localhost
DB_PORT=3306
DB_NAME=whatsapp_sender
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created');
} else {
    // Update port to 3001 if it's not already set
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('PORT=3001')) {
        envContent = envContent.replace(/PORT=\d+/, 'PORT=3001');
        if (!envContent.includes('PORT=3001')) {
            envContent = `PORT=3001\n${envContent}`;
        }
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated .env file with PORT=3001');
    }
}

// Ensure directories exist
const dirs = ['logs', 'sessions'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created ${dir} directory`);
    }
});

console.log('🎯 Starting server on port 3001...');
console.log('🌐 Open http://localhost:3001 in your browser');

// Start the application
require('./src/index.js'); 