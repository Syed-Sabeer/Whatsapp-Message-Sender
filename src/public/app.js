// Global variables
let currentStatus = null;
let phoneNumbers = [];
let messageHistory = [];

// API base URL
const API_BASE_URL = window.location.origin + '/api';

console.log('🚀 WhatsApp Sender Frontend Loaded');
console.log('📡 API Base URL:', API_BASE_URL);

// API call function
async function apiCall(endpoint, data = null) {
    const url = API_BASE_URL + endpoint;
    const options = {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API request failed`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load WhatsApp status
async function loadStatus() {
    try {
        const response = await apiCall('/sessions/status');
        currentStatus = response.data;
        updateStatusDisplay();
    } catch (error) {
        console.error('Error loading status:', error);
        showError('Failed to load WhatsApp status');
    }
}

// Update status display
function updateStatusDisplay() {
    const statusElement = document.getElementById('whatsapp-status');
    const qrElement = document.getElementById('qr-code');
    const logsElement = document.getElementById('logs');

    if (!currentStatus) {
        statusElement.innerHTML = '<span class="text-warning">Loading...</span>';
        return;
    }

    // Update connection status
    if (currentStatus.connected) {
        statusElement.innerHTML = '<span class="text-success">✅ Connected</span>';
        qrElement.innerHTML = '';
    } else if (currentStatus.initializing) {
        statusElement.innerHTML = '<span class="text-info">🔄 Initializing...</span>';
        qrElement.innerHTML = '';
    } else if (currentStatus.qr) {
        statusElement.innerHTML = '<span class="text-warning">📱 QR Code Available</span>';
        qrElement.innerHTML = `
            <div class="text-center">
                <img src="${currentStatus.qr}" alt="QR Code" class="img-fluid" style="max-width: 300px;">
                <p class="mt-2 text-muted">Scan this QR code with your WhatsApp app</p>
            </div>
        `;
    } else {
        statusElement.innerHTML = '<span class="text-danger">❌ Disconnected</span>';
        qrElement.innerHTML = '';
    }

    // Update logs
    if (currentStatus.logs && currentStatus.logs.length > 0) {
        logsElement.innerHTML = currentStatus.logs.map(log => `<div class="log-entry">${log}</div>`).join('');
    }
}

// Add phone number
function addPhoneNumber() {
    const phoneInput = document.getElementById('phone-number');
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber) {
        showError('Please enter a phone number');
        return;
    }

    if (phoneNumbers.includes(phoneNumber)) {
        showError('Phone number already added');
        return;
    }

    phoneNumbers.push(phoneNumber);
    phoneInput.value = '';
    updatePhoneNumbersDisplay();
    showSuccess('Phone number added successfully');
}

// Remove phone number
function removePhoneNumber(index) {
    phoneNumbers.splice(index, 1);
    updatePhoneNumbersDisplay();
    showSuccess('Phone number removed');
}

// Use quick message
function useQuickMessage(message) {
    const messageInput = document.getElementById('message');
    messageInput.value = message;
    messageInput.focus();
    showSuccess(`Quick message loaded: "${message}"`);
}

// Update phone numbers display
function updatePhoneNumbersDisplay() {
    const container = document.getElementById('phone-numbers-list');
    container.innerHTML = phoneNumbers.map((phone, index) => `
        <div class="phone-number-item">
            <span>${phone}</span>
            <button class="btn btn-sm btn-danger" onclick="removePhoneNumber(${index})">Remove</button>
        </div>
    `).join('');
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('message');
    let message = messageInput.value.trim();
    
    // Use default message if input is empty
    if (!message) {
        message = 'This is a default Message';
        showSuccess('Using default message: "This is a default Message"');
    }

    if (phoneNumbers.length === 0) {
        showError('Please add at least one phone number');
        return;
    }

    if (!currentStatus || !currentStatus.connected) {
        showError('WhatsApp is not connected. Please scan the QR code first.');
        return;
    }

    try {
        showLoading('Sending message...');
        
        console.log('Sending message:', {
            phoneNumbers: phoneNumbers,
            message: message
        });

        const response = await apiCall('/sessions/messages/send', {
            phoneNumbers: phoneNumbers,
            message: message
        });

        console.log('Message send response:', response);

        if (response.success) {
            showSuccess('Message sent successfully!');
            messageInput.value = '';
            loadMessageHistory();
        } else {
            showError('Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Load message history
async function loadMessageHistory() {
    try {
        const response = await apiCall('/sessions/messages/history');
        messageHistory = response.data || [];
        updateMessageHistoryDisplay();
    } catch (error) {
        console.error('Error loading message history:', error);
        showError('Failed to load message history');
    }
}

// Update message history display
function updateMessageHistoryDisplay() {
    const container = document.getElementById('message-history');
    
    if (messageHistory.length === 0) {
        container.innerHTML = '<p class="text-muted">No messages sent yet</p>';
        return;
    }

    container.innerHTML = messageHistory.map(message => {
        const date = new Date(message.timestamp).toLocaleString();
        const status = message.totalSent > 0 ? 'Success' : 'Failed';
        const statusClass = message.totalSent > 0 ? 'text-success' : 'text-danger';
        
        return `
            <div class="message-item">
                <div class="message-header">
                    <span class="message-text">${message.message || 'No message'}</span>
                    <span class="message-status ${statusClass}">${status}</span>
                </div>
                <div class="message-details">
                    <span class="message-numbers">Numbers: ${message.phoneNumbers.join(', ')}</span>
                    <span class="message-stats">Sent: ${message.totalSent} | Failed: ${message.totalFailed}</span>
                    <span class="message-date">Date: ${date}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Reconnect WhatsApp
async function reconnectWhatsApp() {
    try {
        showLoading('Reconnecting...');
        const response = await apiCall('/sessions/reconnect', {});
        
        if (response.success) {
            showSuccess('Reconnection initiated');
            setTimeout(loadStatus, 2000); // Reload status after 2 seconds
        } else {
            showError('Failed to reconnect');
        }
    } catch (error) {
        console.error('Error reconnecting:', error);
        showError('Failed to reconnect: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Utility functions
function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.getElementById('alerts').appendChild(alertDiv);
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.getElementById('alerts').appendChild(alertDiv);
}

function showLoading(message) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = `
        <div class="d-flex justify-content-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-2">${message}</span>
        </div>
    `;
    loadingDiv.style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Auto-refresh status every 3 seconds for faster QR code detection
setInterval(loadStatus, 3000);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStatus();
    loadMessageHistory();
}); 