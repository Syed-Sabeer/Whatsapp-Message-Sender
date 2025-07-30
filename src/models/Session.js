class Session {
    constructor(id, name, phoneNumbers = [], messages = []) {
        this.id = id;
        this.name = name;
        this.phoneNumbers = phoneNumbers;
        this.messages = messages;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.isConnected = false;
        this.qrCode = null;
    }

    addPhoneNumber(number) {
        if (!this.phoneNumbers.includes(number)) {
            this.phoneNumbers.push(number);
            this.updatedAt = new Date();
        }
    }

    removePhoneNumber(number) {
        const index = this.phoneNumbers.indexOf(number);
        if (index > -1) {
            this.phoneNumbers.splice(index, 1);
            this.updatedAt = new Date();
        }
    }

    addMessage(message) {
        this.messages.push({
            ...message,
            timestamp: new Date()
        });
        this.updatedAt = new Date();
    }

    setConnectionStatus(status) {
        this.isConnected = status;
        this.updatedAt = new Date();
    }

    setQRCode(qrCode) {
        this.qrCode = qrCode;
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            phoneNumbers: this.phoneNumbers,
            messages: this.messages,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isConnected: this.isConnected,
            qrCode: this.qrCode
        };
    }
}

module.exports = Session; 