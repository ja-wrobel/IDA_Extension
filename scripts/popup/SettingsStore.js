class SettingsStore {
    constructor() {
        this.userSettings = null;
        this.currentProjectName = "";
        this.isValidProject = false;
    }

    async load() {
        try {
            this.userSettings = await this.loadStoredData();
            [this.currentProjectName, this.isValidProject] = await this.loadProjectName();
        }
        catch (e) {
            console.error("Error loading stored user settings", e);
        }
    }

    saveData() {
        chrome.storage.local.set({ userSettings: this.userSettings });
    }

    async loadStoredData() {
        return new Promise((resolve) => {
            chrome.storage.local.get("userSettings", (data) => {
                if (data.userSettings) {
                    resolve(data.userSettings);
                }
                resolve(null);
            });
        });
    }

    async loadProjectName() {
        return new Promise((resolve) => {
            chrome.tabs.query({active: true, currentWindow: true}).then((tabs) => {
                if (tabs.length === 0) {
                    resolve(["Wejdź w IDA do projektu by ustawić skróty na atrybuty", false]);
                }
                const title = tabs[0].title;
                const url = tabs[0].url;
                const projectName = url.split("/")[5]
                if (projectName === "" || projectName === undefined || title !== "IDA") {
                    resolve(["Wejdź w IDA do projektu by ustawić skróty na atrybuty", false]);
                }
                resolve([projectName, true]);
            });
        });
    }

    isGroupSettingValid(setting) {
        if (
            typeof setting !== "object" ||
            setting === null ||
            typeof setting.alt !== "boolean" ||
            typeof setting.key !== "string" ||
            typeof setting.value !== "string" ||
            setting.key.length > 1
        ) {
            return false;
        }
        return true;
    }

    _getSelectedGroupId() {
        return Number(this.userSettings.selectedGroupId);
    }
    /** @param {number|string} id */
    _setSelectedGroupId(id) {
        if (id === null || isNaN(id) === true || typeof id === "boolean") {
            console.error("Invalid group ID:", id);
            return;
        }
        this.userSettings.selectedGroupId = Number(id);
        this.saveData();
    }

    /** @returns {Array<object>|object|null} @param {number|string|undefined} index */
    _getSelectedGroupData(index) {
        if (this._getSelectedGroupId() === -1) {
            return null;
        }
        if (typeof index === "number" || typeof index === "string") {
            return this.userSettings._custom[this._getSelectedGroupId()].data[index];
        }
        return this.userSettings._custom[this._getSelectedGroupId()].data;
    }
    /**
     * @param {number|string|null} index Set to `null` to set all group settings at once
     * @param {object} [settings={}]
     * @param {string} [settings.key]
     * @param {string} [settings.value]
     * @param {boolean} [settings.alt] 
     * @param {Array<object>} [settings=[{}]]
     * @param {string} [settings[].key]
     * @param {string} [settings[].value]
     * @param {boolean} [settings[].alt]
     */
    _setSelectedGroupData(index, settings = {}) {
        if (this._getSelectedGroupId() === -1 || isNaN(index) === true) {
            return;
        }
        const { key, value, alt } = settings;
        if (Array.isArray(settings) === true && index === null) {
            for (const setting of settings) {
                if (this.isGroupSettingValid(setting) === false) {
                    throw Error(`Invalid group setting: ${JSON.stringify(setting)}`);
                }
            }
            this.userSettings._custom[this._getSelectedGroupId()].data = settings;
            this.saveData();
            return;
        }
        if (typeof key === "string" && key.length <= 1) {
            this.userSettings._custom[this._getSelectedGroupId()].data[index].key = key;
        }
        if (typeof value === "string") {
            this.userSettings._custom[this._getSelectedGroupId()].data[index].value = value;
        }
        if (typeof alt === "boolean") {
            this.userSettings._custom[this._getSelectedGroupId()].data[index].alt = alt;
        }
        this.saveData();
    }

    /** @returns {string|null} */
    _getSelectedGroupName() {
        if (this._getSelectedGroupId() === -1) {
            return null;
        }
        return this.userSettings._custom[this._getSelectedGroupId()].name;
    }
    /** @param {string} name  */
    _setSelectedGroupName(name) {
        if (this._getSelectedGroupId() === -1 || typeof name !== "string") {
            return;
        }
        this.userSettings._custom[this._getSelectedGroupId()].name = name;
        this.saveData();
    }

    /** @returns {Array<object>|object} @param {number|string|undefined} groupId */
    _getCustomSettings(groupId) {
        if (typeof groupId === "number" || typeof groupId === "string") {
            return this.userSettings._custom[groupId];
        }
        return this.userSettings._custom;
    }

    /** @returns {object|null|undefined} @param {string|undefined} attributeName */
    _getAttrsSettings(attributeName) {
        if (this.isValidProject === false) {
            return null;
        }
        const attrs = this.userSettings._attrs;
        if (attrs[this.currentProjectName] === undefined) {
            this.userSettings._attrs[this.currentProjectName] = {};
        }
        if (typeof attributeName === "string") {
            return this.userSettings._attrs[this.currentProjectName][attributeName];
        }
        return this.userSettings._attrs[this.currentProjectName];
    }
    /**
     * @param {string} attributeName 
     * @param {object} [setting={}]
     * @param {string} [setting.key]
     * @param {string} [setting.value]
     * @param {boolean} [setting.alt]
     */
    _setAttrsSetting(attributeName, setting = {}) {
        if (this.isValidProject === false || typeof attributeName !== "string") {
            return;
        }
        const { key, value, alt } = setting;
        if (typeof key === "string" && key.length <= 1) {
            this.userSettings._attrs[this.currentProjectName][attributeName].key = key;
        }
        if (typeof value === "string") {
            this.userSettings._attrs[this.currentProjectName][attributeName].value = value;
        }
        if (typeof alt === "boolean") {
            this.userSettings._attrs[this.currentProjectName][attributeName].alt = alt;
        }
        this.saveData();
    }

    /** @returns {object|undefined} @param {string|undefined} name */
    _getMainSettings(name) {
        if (typeof name === "string") {
            return this.userSettings._main[name];
        }
        return this.userSettings._main;
    }
    /** 
     * @param {string} name 
     * @param {object} [setting={}] 
     * @param {string} [setting.key]
     * @param {boolean} [setting.alt]
     */
    _setMainSetting(name, setting = {}) {
        if (typeof name !== "string") {
            return;
        }
        const { key, alt } = setting;
        if (typeof key === "string" && (key.length <= 1 || name === "tooltipSize")) {
            this.userSettings._main[name].key = key;
        }
        if (typeof alt === "boolean") {
            this.userSettings._main[name].alt = alt;
        }
        this.saveData();
    }

    /** 
     * @param {string|undefined} name 
     * @returns {object|boolean|undefined}  `boolean` when name is provided - ! NOT a reference in that case !
     */
    _getFuncsSettings(name) {
        if (typeof name === "string") {
            return this.userSettings._funcs[name];
        }
        return this.userSettings._funcs;
    }
    /** @param {string} name @param {boolean} alt  */
    _setFuncsSetting(name, alt) {
        if (typeof name !== "string" || typeof alt !== "boolean") {
            return;
        }
        this.userSettings._funcs[name] = alt;
        this.saveData();
    }

    /** @returns {Array<string>} */
    _getReservedKeys() {
        return this.userSettings.reservedKeys;
    }

    /** @returns {Array<object>|object|undefined} @param {number|string|undefined} index */
    _getDuplicatedShortcuts(index) {
        if (typeof index === "number" || typeof index === "string") {
            if (this._getSelectedGroupId() === -1) {
                return this.getOnlyMainDuplicates(index);
            }
            return this.getGroupProjectDuplicates(index);
        }
        if (this._getSelectedGroupId() === -1) {
            return this.getOnlyMainDuplicates();
        }
        return this.getGroupProjectDuplicates();
    }
    /** @returns {Array<object>} */
    _getDuplicates() {
        return this.userSettings.duplicates;
    }

    /** @returns {Array<object>} */
    _getAllShortcuts(withCustomFilters = true) {
        const allShortcuts = [...Object.values(this._getMainSettings())];
        if (this._getSelectedGroupId() !== -1 && withCustomFilters === true) {
            allShortcuts.push(...Object.values(this._getSelectedGroupData()));
        }
        if (this.isValidProject === true) {
            allShortcuts.push(...Object.values(this._getAttrsSettings()));
        }
        return allShortcuts;
    }

    /** @returns {Array<object>|object|undefined} @param {string|number|undefined} index */
    getOnlyMainDuplicates(index) {
        if (typeof index === "number" || typeof index === "string") {
            if (this.isValidProject === false) {
                return this.userSettings.onlyMainDuplicates.defaults[index];
            }
            if (onlyMainDuplicates[this.currentProjectName] !== undefined) {
                return this.userSettings.onlyMainDuplicates[this.currentProjectName][index];
            }
            return undefined;
        }
        if (this.isValidProject === false) {
            return this.userSettings.onlyMainDuplicates.defaults;
        }
        const onlyMainDuplicates = this.userSettings.onlyMainDuplicates;
        if (onlyMainDuplicates[this.currentProjectName] === undefined) {
            this.userSettings.onlyMainDuplicates[this.currentProjectName] = [];
            this.saveData();
        }
        return this.userSettings.onlyMainDuplicates[this.currentProjectName];
    }

    /** @returns {Array<object>|object|undefined} @param {string|number|undefined} index */
    getGroupProjectDuplicates(index) {
        const duplicates = this.userSettings.duplicates[this._getSelectedGroupId()];
        if (duplicates === undefined) {
            return undefined;
        }
        if (typeof index === "number" || typeof index === "string") {
            if (this.isValidProject === false) {
                return duplicates.defaults[index];
            }
            if (duplicates[this.currentProjectName] !== undefined) {
                return duplicates[this.currentProjectName][index];
            } else {
                return undefined;
            }
        }
        if (this.isValidProject === false) {
            if (duplicates.defaults === undefined) {
                this.userSettings.duplicates[this._getSelectedGroupId()].defaults = [];
                this.saveData();
            }
            return this.userSettings.duplicates[this._getSelectedGroupId()].defaults;
        }
        if (duplicates[this.currentProjectName] === undefined) {
            this.userSettings.duplicates[this._getSelectedGroupId()][this.currentProjectName] = [];
            this.userSettings.duplicates[this._getSelectedGroupId()].defaults = [];
            this.saveData();
        }
        return this.userSettings.duplicates[this._getSelectedGroupId()][this.currentProjectName];
    }
}

export { SettingsStore };