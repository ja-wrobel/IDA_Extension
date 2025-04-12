class EventListeners {
    constructor() {
        this.callbacks = new Map(); // [target, callback] pairs
    }

    isKonvaElement(target) {
        return typeof target.on === "function" && typeof target.off === "function";
    }

    add(eventType = [], target, callback) {
        for (let i = 0; i < eventType.length; ++i) {
            if (!this.callbacks.has(eventType[i])) {
                this.callbacks.set(eventType[i], []);
            }
            this.callbacks.get(eventType[i]).push({ target, callback });
    
            if (this.isKonvaElement(target)) {
                target.on(eventType[i], callback);
            } else {
                target.addEventListener(eventType[i], callback);
            }
        }
    }

    remove(eventType, target, callback) {
        if (this.callbacks.has(eventType)) {
            this.callbacks.set(eventType, this.callbacks.get(eventType).filter(entry => {
                if (entry.target === target && entry.callback === callback) {
                    if (this.isKonvaElement(target)) {
                        target.off(eventType, callback);
                    } else {
                        target.removeEventListener(eventType, callback);
                    }
                    return false;
                }
                return true;
            }));
        }
    }

    removeAll(eventType = [], target) {
        for (let i = 0; i < eventType.length; ++i) { 
            if (this.callbacks.has(eventType[i])) {
                this.callbacks.get(eventType[i]).forEach(entry => {
                    if (entry.target === target) {
                        if (this.isKonvaElement(target)) {
                            target.off(eventType[i], entry.callback);
                        } else {
                            target.removeEventListener(eventType[i], entry.callback);
                        }
                    }
                });
                this.callbacks.set(eventType[i], this.callbacks.get(eventType[i]).filter(entry => entry.target !== target));
            }
        }
    }
}

export { EventListeners };