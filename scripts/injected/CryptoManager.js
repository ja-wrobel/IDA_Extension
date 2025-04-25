class CryptoManager {
    constructor() {
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
        this.encryptionKey = null; 
        this.iv = null;
        this.salt = null;
        this.id = null;
    }

    async getKeyMaterial() {
        if (this.id === null) {
            return null;
        }
        return crypto.subtle.importKey(
            'raw',
            this.encoder.encode(this.id),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
    }

    async deriveKey(salt) {
        const keyMaterial = await this.getKeyMaterial();
        if (!keyMaterial) { 
            throw new Error("Unable to import key material.");
        }
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100_000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async encryptData(data) {
        this.iv = crypto.getRandomValues(new Uint8Array(12));
        this.salt = crypto.getRandomValues(new Uint8Array(16));
        const encodedData = this.encoder.encode(data);
        const key = await this.deriveKey(this.salt);

        if (!key) {
            throw new Error("Unable to derive key.");
        }
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: this.iv
            },
            key,
            encodedData
        );
        return {
            data: this.arrayBufferToBase64(encryptedData),
            iv: this.arrayBufferToBase64(this.iv),
            salt: this.arrayBufferToBase64(this.salt)
        };
    }

    async decryptData(encryptedData) {
        if (!this.salt) {
            throw new Error("Salt was not set.");
        }
        if (!this.iv) {
            throw new Error("IV was not set.");
        }
        const key = await this.deriveKey(this.salt);
        if (!key) {
            throw new Error("Unable to derive key.");
        }
        if (typeof encryptedData === 'string') {
            encryptedData = this.base64ToArrayBuffer(encryptedData);
        }
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: this.iv
            },
            key,
            encryptedData
        );
        return this.decoder.decode(decryptedData);
    }

    setIV(iv) {
        this.iv = this.base64ToArrayBuffer(iv);
    }

    setSalt(salt) {
        this.salt = this.base64ToArrayBuffer(salt);
    }

    setID(id) {
        this.id = id;
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";

        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
      
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

export { CryptoManager };