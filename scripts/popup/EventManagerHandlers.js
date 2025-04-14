class EventManagerHandlers {
    _init_(settings, renders) {
        this.settings = settings;
        this.renders = renders;
    }
    
    handleInputKeyChange(e, targetSetting) {
        const newValCode = this.isKeyAvailable(e.target.value, targetSetting.alt);
        const oldValCode = this.isKeyAvailable(targetSetting.key, targetSetting.alt, {onlyReturnCode: true});
        if (newValCode === 0) {
            e.target.value = targetSetting.key;
            return;
        } 
        if (oldValCode === 1) {
            this.settings.removeDuplicatedShortcut(targetSetting.key, targetSetting.alt);
        }
        targetSetting.key = e.target.value;
        this.settings.saveData();
        this.renders.highlightDuplicatedKeys();
    }

    handleCheckboxClick(e, targetSetting) {
        const newValCode = this.isKeyAvailable(targetSetting.key, e.target.checked);
        const oldValCode = this.isKeyAvailable(targetSetting.key, targetSetting.alt, {onlyReturnCode: true});
        if (newValCode === 0) {
            e.target.checked = targetSetting.alt;
            return;
        }
        if (oldValCode === 1) {
            this.settings.removeDuplicatedShortcut(targetSetting.key, targetSetting.alt);
        }
        targetSetting.alt = e.target.checked;
        this.settings.saveData();
        this.renders.highlightDuplicatedKeys();
    }

    setImportedGroupSettings(settingsObj, scope) {
        const clonedSelectedGroupData = structuredClone(this.settings._getSelectedGroupData());
        this.settings._setSelectedGroupData(null, []);
        for (let i = 0; i < settingsObj.length; ++i) {
            const code = this.isKeyAvailable(settingsObj[i].key, settingsObj[i].alt, {withSelected: false});
            if (code === 0) {
                settingsObj[i].key = "";
            }
        }
        try {
            this.settings._setSelectedGroupData(null, settingsObj);
        } catch (e) {
            alert("Niepoprawna struktura grupy - Import nieudany.");
            this.settings._setSelectedGroupData(null, clonedSelectedGroupData);
            console.error(e);
        }
        this.renders.updateDOM(scope);
    }
    
    getNewFiltersGroupName(projectName, isValid) {
        let groupName = "";
        if (isValid === true) {
            let parts = projectName.split("_");
            parts.forEach((part) => {
               groupName += part.slice(0, 3);
                if (part !== parts[parts.length - 1]) {
                    groupName += "_";
                }
            });
        } else {
            groupName = "Grupa";
        }
        let index = 1;
        for (let i = 0; i < this.settings._getCustomSettings().length; ++i) {
            const arr = this.settings._getCustomSettings(i).name.split(" ");
            if (arr[0] === groupName && index <= Number(arr[1])) {
                index = Number(arr[1]) + 1;
            }
        }
        groupName += ` ${index}`;
        return groupName;
    }
    
    /**
     * Compares given shortcut with existing ones and displays proper alert when shortcut is already in use.
     * @param {string} key 
     * @param {boolean} alt 
     * @param {Object} [options={}] - Additional options for the check.
     * @param {boolean} [options.withCustomFilters=true] - Whether to include selected group keys in the comparison.
     * @param {boolean} [options.onlyReturnCode=false] - If true, only return the code without triggering alerts or adding duplicates.
     * @returns {0|1|2} 
     * - `0` - Shortcut reserved by IDA; 
     * - `1` - Shortcut already assigned by extension; 
     * - `2` - Shortcut available
     */
    isKeyAvailable(key, alt, options = {}) {
        if (key === "") {
            return 2;
        }
        const { withCustomFilters = true, onlyReturnCode = false } = options;
        const reservedKeys = this.settings._getReservedKeys();
        if (reservedKeys.includes(key)) {
            if (onlyReturnCode === false) {
                alert(`${alt ? "Alt + " : ""}${key.toUpperCase()} jest zarezerwowany przez IDA`);
            }
            return 0;
        }
        const allShortcuts = this.settings._getAllShortcuts(withCustomFilters);
        for (const action of allShortcuts) {
            if (key === action.key && alt === action.alt) {
                if (onlyReturnCode === false) {
                    alert(`${alt ? "Alt + " : ""}${key.toUpperCase()} jest już w użytku`);
                    this.settings.addDuplicatedShortcut(key, alt);
                }
                return 1;
            }
        }
        if (onlyReturnCode === false) {
            this.settings.removeDuplicatedShortcut(key, alt);
        }
        return 2;
    }

    /**
     * @param {string} selector 
     * @param {string} event 
     * @param {Function} callback 
     * @param {AbortSignal} signal 
     */
    addEventListeners(selector, event, callback, signal) {
        document.querySelectorAll(selector).forEach(element => {
            if (!element) return;
            element.addEventListener(event, callback, { signal });
        });
    }
}

export { EventManagerHandlers };
