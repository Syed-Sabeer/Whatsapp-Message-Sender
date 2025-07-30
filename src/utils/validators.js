class Validators {
    static validatePhoneNumber(phoneNumber) {
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            return { isValid: false, error: 'Phone number must be a string' };
        }
        
        // Remove all non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // Check if it's a valid length (7-15 digits)
        if (cleaned.length < 7 || cleaned.length > 15) {
            return { isValid: false, error: 'Phone number must be between 7 and 15 digits' };
        }
        
        return { isValid: true, cleaned };
    }
    
    static validateMessage(message) {
        if (!message || typeof message !== 'string') {
            return { isValid: false, error: 'Message must be a string' };
        }
        
        if (message.trim().length === 0) {
            return { isValid: false, error: 'Message cannot be empty' };
        }
        
        if (message.length > 4096) {
            return { isValid: false, error: 'Message too long (max 4096 characters)' };
        }
        
        return { isValid: true };
    }
    
    static validateSessionName(name) {
        if (!name || typeof name !== 'string') {
            return { isValid: false, error: 'Session name must be a string' };
        }
        
        if (name.trim().length === 0) {
            return { isValid: false, error: 'Session name cannot be empty' };
        }
        
        if (name.length > 100) {
            return { isValid: false, error: 'Session name too long (max 100 characters)' };
        }
        
        // Check for valid characters
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
            return { isValid: false, error: 'Session name contains invalid characters' };
        }
        
        return { isValid: true };
    }
    
    static validateSessionId(sessionId) {
        if (!sessionId || typeof sessionId !== 'string') {
            return { isValid: false, error: 'Session ID must be a string' };
        }
        
        if (sessionId.length < 10 || sessionId.length > 50) {
            return { isValid: false, error: 'Invalid session ID format' };
        }
        
        return { isValid: true };
    }
    
    static validatePhoneNumbersArray(phoneNumbers) {
        if (!Array.isArray(phoneNumbers)) {
            return { isValid: false, error: 'Phone numbers must be an array' };
        }
        
        if (phoneNumbers.length === 0) {
            return { isValid: false, error: 'Phone numbers array cannot be empty' };
        }
        
        if (phoneNumbers.length > 100) {
            return { isValid: false, error: 'Too many phone numbers (max 100)' };
        }
        
        const validatedNumbers = [];
        const errors = [];
        
        for (let i = 0; i < phoneNumbers.length; i++) {
            const validation = this.validatePhoneNumber(phoneNumbers[i]);
            if (validation.isValid) {
                validatedNumbers.push(validation.cleaned);
            } else {
                errors.push(`Phone number ${i + 1}: ${validation.error}`);
            }
        }
        
        if (errors.length > 0) {
            return { isValid: false, error: errors.join('; ') };
        }
        
        return { isValid: true, validatedNumbers };
    }
}

module.exports = Validators; 