import { SettingsStore } from "./SettingsStore.js";

class SettingsManager extends SettingsStore {
    constructor() {
        super();
    }

    removeGroupSetting(index) {
        if (this._getSelectedGroupId() === -1) {
            return null;
        }
        if (index < 0 || index >= this._getSelectedGroupData().length) {
            console.error("Invalid group setting index:", index);
            return null;
        }
        const groupSetting = structuredClone(this._getSelectedGroupData(index));
        this._getSelectedGroupData().splice(index, 1);
        this.saveData();
        return groupSetting;
    }

    addGroupSetting() {
        if (this._getSelectedGroupId() === -1) {
            alert("Nie można dodać nowego skrótu, ponieważ nie wybrano grupy.");
            return;
        }
        if (this._getSelectedGroupData().length >= 40) {
            alert("Maksymalna liczba filtrów to 40!");
            return;
        }
        this._getSelectedGroupData().push({
            key: "",
            value: "",
            alt: false
        });
        this.saveData();
    }

    createNewCustomGroup(groupName) {
        const index = this.userSettings._custom.length;
        this.userSettings._custom[index] = {
            name: groupName,
            data: [
                {key: "", value: "", alt: false}
            ]
        };
        this.userSettings.selectedGroupId = index;
        this.userSettings.duplicates[index] = {};
        if (this.isValidProject === true) {
            this.userSettings.duplicates[index][this.currentProjectName] = [];
        } else {
            this.userSettings.duplicates[index].defaults = [];
        }
        this.saveData();
    }

    deleteSelectedGroup() {
        if (this._getSelectedGroupId() === -1) {
            alert("Najpierw utwórz grupę, aby móc ją usunąć.");
            return;
        }
        const deletedGroupId = this._getSelectedGroupId();
        const groupLength = this._getCustomSettings().length;
        this._getCustomSettings().splice(
            this._getSelectedGroupId(), 
            1
        );
        this._getDuplicates().splice(
            this._getSelectedGroupId(), 
            1
        );
        if (deletedGroupId === groupLength - 1) {
            this._setSelectedGroupId(deletedGroupId - 1);
        }
        this.saveData();
    }
    
    addDuplicatedShortcut(key, alt) {
        const index = this.findInDuplicates(key, alt);
        if (index !== null) {
            this._getDuplicatedShortcuts(index).appearances += 1;
            this.saveData();
            return;
        }
        this._getDuplicatedShortcuts().push({
            key: key,
            alt: alt,
            appearances: 2
        });
        this.saveData();
    }

    removeDuplicatedShortcut(key, alt) {
        const index = this.findInDuplicates(key, alt);
        if (index !== null && this._getDuplicatedShortcuts(index).appearances <= 2) {
            this._getDuplicatedShortcuts().splice(index, 1);
        } 
        else if (index !== null) {
            this._getDuplicatedShortcuts(index).appearances -= 1;
        }
        this.saveData();
    }

    findInDuplicates(key, alt) {
        for (const [index, entry] of Object.entries(this._getDuplicatedShortcuts())) {
            if (key === entry.key && alt === entry.alt) {
                return Number(index);
            }
        }
        return null;
    }

    updateExistingDuplicates() {
        const duplicates = this._getDuplicatedShortcuts();
        const toBeRemoved = [];
        for (const entry of duplicates) {
            let appearances = 0;
            for (const shortcut of this._getAllShortcuts()) {
                if (shortcut.key === "" || typeof shortcut.alt !== "boolean") {
                    continue;
                }
                if (entry.key === shortcut.key && entry.alt === shortcut.alt) {
                    appearances += 1;
                }
            }
            entry.appearances = appearances;
            if (entry.appearances <= 1) {
                toBeRemoved.push(entry);
            }
        }
        for (const entry of toBeRemoved) {
            this.removeDuplicatedShortcut(entry.key, entry.alt);
        }
        this.saveData();
    }

    searchForNewDuplicates(key, alt) {
        if (typeof key !== "string" || key === "" || typeof alt !== "boolean") {
            return;
        }
        const duplicateIndex = this.findInDuplicates(key, alt);
        const allShortcuts = this._getAllShortcuts();
        let duplicateAppearances = 0;
        let currentAppearances = 0;
        if (duplicateIndex !== null) {
            duplicateAppearances = this._getDuplicatedShortcuts(duplicateIndex).appearances;
        }
        for (const entry of allShortcuts) {
            if (entry.key === "" || typeof entry.alt !== "boolean") {
                continue;
            }
            if (entry.key === key && entry.alt === alt) {
                currentAppearances += 1;
                if (currentAppearances > duplicateAppearances && currentAppearances > 1) {
                    this.addDuplicatedShortcut(key, alt);
                }
            }
        }
        const appearancesDifference = duplicateAppearances - currentAppearances;
        for (let i = 0; i < appearancesDifference; i++) {
            this.removeDuplicatedShortcut(key, alt);
        }
        this.saveData();
    }
}

export { SettingsManager };