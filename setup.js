const fs = require('fs');
const path = require('path');

console.log('🚀 WhatsApp Sender Setup');
console.log('========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    
    const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# WhatsApp Configuration
SESSION_PATH=./sessions
LOG_LEVEL=info

# Message Configuration
DEFAULT_MESSAGE_DELAY=1000
MAX_RETRY_ATTEMPTS=3

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=whatsapp_sender
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
} else {
    console.log('✅ .env file already exists');
}

// Check if logs directory exists
const logsPath = path.join(__dirname, 'logs');
if (!fs.existsSync(logsPath)) {
    console.log('📁 Creating logs directory...');
    fs.mkdirSync(logsPath, { recursive: true });
    console.log('✅ Logs directory created successfully!');
} else {
    console.log('✅ Logs directory already exists');
}

// Check if sessions directory exists
const sessionsPath = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsPath)) {
    console.log('📁 Creating sessions directory...');
    fs.mkdirSync(sessionsPath, { recursive: true });
    console.log('✅ Sessions directory created successfully!');
} else {
    console.log('✅ Sessions directory already exists');
}

console.log('\n📋 Next Steps:');
console.log('1. Make sure MySQL is installed and running');
console.log('2. Create the database by running:');
console.log('   mysql -u root -p < scripts/setup-database.sql');
console.log('3. Update the .env file with your MySQL credentials');
console.log('4. Run the application: npm start');
console.log('\n💡 If you don\'t have MySQL installed, you can:');
console.log('   - Install MySQL from: https://dev.mysql.com/downloads/');
console.log('   - Or use XAMPP: https://www.apachefriends.org/');
console.log('   - Or use a cloud MySQL service');

console.log('\n🎉 Setup completed!'); 