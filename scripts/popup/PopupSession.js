class PopupSession {
    constructor(settings, renders, eventManager) {
        this.settings = settings;
        this.renders = renders;
        this.eventManager = eventManager;
    }

    async _init_() {
        try {
            await this.settings.load();
            this.renders._init_(this.settings);
            this.eventManager._init_(this.settings, this.renders);
        } catch (error) {
            console.error("Error initializing Popup:", error);
        }
    }

    updateScope(scope) {
        this.renders.updateDOM(scope);
        this.eventManager.setEventListeners(scope);
    }
}

export { PopupSession };