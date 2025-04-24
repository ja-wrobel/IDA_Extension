class CryptoManager {
    constructor() {
        this.encryptionKey = null; 
        this.iv = null;
    }

    async encryptData(data) {
        this.iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);

        if (!this.encryptionKey) {
            await this.getEncryptionKey();
        }
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: this.iv
            },
            this.encryptionKey,
            encodedData
        );
        return {
            data: this.arrayBufferToBase64(encryptedData),
            iv: this.arrayBufferToBase64(this.iv)
        };
    }

    async decryptData(encryptedData) {
        if (!this.encryptionKey) {
            await this.getEncryptionKey();
        }
        if (!this.iv) {
            throw new Error("IV was not set.");
        }
        encryptedData = this.base64ToArrayBuffer(encryptedData);
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: this.iv
            },
            this.encryptionKey,
            encryptedData
        );
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    }

    setIV(iv) {
        this.iv = this.base64ToArrayBuffer(iv);
    }

    async setEncryptionKey(key) {
        const importedKey = await crypto.subtle.importKey(
            "jwk",
            key,
            { name: "AES-GCM" },
            true,
            ["encrypt", "decrypt"]
        );
        this.encryptionKey = importedKey;
    }

    async getEncryptionKey() {
        window.postMessage("GET_ENCRYPTION_KEY");
        let attempts = 0;
        while (!this.encryptionKey && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100)); // wait for key to be set
            attempts++;
        }
        if (!this.encryptionKey) {
            throw new Error("Failed to retrieve encryption key after maximum attempts.");
        }
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