import { EventManagerHandlers } from "./EventManagerHandlers.js";

class EventManager extends EventManagerHandlers {
    constructor () {
        super();
        this.abortController = null;
    }
    
    setEventListeners(scope) {
        if (this.abortController !== null) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        const { signal } = this.abortController;

        switch (scope) {
            case "_custom":
                this.addCustomEvents(scope, signal);
                break;
            case "_attrs":
                this.addAttrsEvents(signal);
                break;
            case "_funcs":
                this.addEventListeners(".setting-checkbox", "click", (e) => {
                    this.settings._setFuncsSetting(e.target.name, e.target.checked);
                }, signal);
                break;
            default:
                this.addMainEvents(signal);
                break;
        }
    }

    addMainEvents(signal) {
        this.addEventListeners(".setting-inp-key", "keydown", (e) => {
            if (e.key !== "Backspace") {
                e.preventDefault();
            }
        }, signal);
        this.addEventListeners(".setting-inp-key", "keyup", (e) => {
            if (e.key !== "Backspace") {
                e.preventDefault();
            }
            if (e.target.name === "displayTTipPeriod") {
                if (isNaN(e.target.value) === true) {
                    e.target.value = this.settings._getMainSettings(e.target.name).key;
                    return;
                }
                this.settings._setMainSetting(e.target.name, {key: e.target.value});
                return;
            }
            if (e.target.name === "tooltipSize") {
                const val = Number(e.target.value);
                if (isNaN(val) === true || val < 1 || val > 30) {
                    e.target.value = this.settings._getMainSettings(e.target.name).key;
                    return;
                }
                this.settings._setMainSetting(e.target.name, {key: val});
                return;
            }
            this.handleInputKeyChange(
                e, 
                this.settings._getMainSettings(e.target.name)
            )
        }, signal);
        this.addEventListeners(".setting-inp-key", "click", (e) => {
            if (e.target.name === "tooltipSize") return;
            e.target.select();
        }, signal);

        this.addEventListeners(".setting-checkbox", "click", (e) => {
            this.handleCheckboxClick(
                e, 
                this.settings._getMainSettings(e.target.name)
            )
        }, signal);
    }

    addAttrsEvents(signal) {
        this.addEventListeners(".setting-checkbox", "click", (e) => {
            if (this.settings.isValidProject === true) {
                const attributeName = e.target.getAttribute("data-name");
                this.handleCheckboxClick(
                    e, 
                    this.settings._getAttrsSettings(attributeName)
                );
            }
        }, signal);

        this.addEventListeners(".setting-inp-key", "keydown", (e) => {
            if (e.key !== "Backspace") {
                e.preventDefault();
            }
        }, signal);
        this.addEventListeners(".setting-inp-key", "keyup", (e) => {
            if (e.key !== "Backspace") {
                e.preventDefault();
            }
            if (this.settings.isValidProject === true) {
                const attributeName = e.target.getAttribute("data-name");
                this.handleInputKeyChange(
                    e, 
                    this.settings._getAttrsSettings(attributeName)
                );
            }
        }, signal);

        this.addEventListeners(".setting-inp-key", "click", (e) => e.target.select(), signal);

        this.addEventListeners(".setting-inp-val", "change", (e) => {
            const attributeName = e.target.getAttribute("data-name");
            this.settings._setAttrsSetting(attributeName, {value: e.target.value});
            this.settings.saveData();
        }, signal);
    }

    addCustomEvents(scope, signal) {
        this.addCustomGroupsFieldEvents(
            scope, 
            signal
        );
        this.addEventListeners("#content-list", "scroll", () => this.renders.hideArrows(), signal);
        this.addEventListeners("#dynamic-groups", "scroll", () => this.renders.hideArrows(), signal);

        this.addCustomFiltersFieldEvents(
            scope,
            signal
        );
    }

    addCustomGroupsFieldEvents(scope, signal) {
        this.addEventListeners(".groups-nav-btn", "click", (e) => {
            const id = e.target.getAttribute("data-index");
            if (Number(id) === this.settings._getSelectedGroupId()) {
                return;
            }
            this.settings._setSelectedGroupId(id);
            this.settings.updateExistingDuplicates();
            this.renders.updateDOM(scope);
            this.setEventListeners(scope);
        }, signal);
        this.addEventListeners("#nav-left", "click", () => {
            const groupsField = document.getElementById("dynamic-groups");
            const averageGroupFieldWidth = 50;
            groupsField.scrollLeft -= averageGroupFieldWidth;
            groupsField.dispatchEvent(new Event("scroll", { bubbles: true }));
        }, signal);
        this.addEventListeners("#nav-right", "click", () => {
            const groupsField = document.getElementById("dynamic-groups");
            const averageGroupFieldWidth = 50;
            groupsField.scrollLeft += averageGroupFieldWidth;
            groupsField.dispatchEvent(new Event("scroll", { bubbles: true }));
        }, signal);

        this.addEventListeners("#delete-group", "click", () => {
            if (this.settings._getFuncsSettings().showWarningOnGroupDelete === true) {
                const confirmed = confirm("Jesteś pewien, że chcesz usunąć tę grupę?");
                if (confirmed === false) {
                    return;
                }
            }
            this.settings.deleteSelectedGroup();
            this.settings.updateExistingDuplicates();
            this.renders.updateDOM(scope);
            this.setEventListeners(scope);
        }, signal);
        this.addEventListeners("#new-group", "click", () => {
            const groupName = this.getNewFiltersGroupName(
                this.settings.currentProjectName, 
                this.settings.isValidProject
            );
            this.settings.createNewCustomGroup(groupName);
            this.renders.updateDOM(scope);
            this.setEventListeners(scope);
        }, signal);

        this.addEventListeners("#copy-group", "click", () => {
            if (this.settings._getSelectedGroupId() === -1) {
                alert("Najpierw utwórz grupę!");
                return;
            }
            navigator.clipboard.writeText(
                JSON.stringify(this.settings._getSelectedGroupData())
            );
        }, signal);
        this.addEventListeners("#import-group-conf", "click", () => {
            if (this.settings._getSelectedGroupId() === -1) {
                alert("Najpierw utwórz grupę!");
                return;
            }
            const enteredData = document.getElementById("import-group-inp").value;
            try {
                this.setImportedGroupSettings(
                    JSON.parse(enteredData), 
                    scope
                );
                this.setEventListeners(scope);
            } catch (e) {
                alert("Niepoprawna struktura grupy - Import nieudany.");
                console.error("Error importing custom group settings: ", e);
                return;
            }
        }, signal);
        this.addEventListeners("#import-group-canc", "click", (e) => this.renders.handleGroupButtonsVisiblity(e.target), signal);
        this.addEventListeners("#import-group", "click", (e) => this.renders.handleGroupButtonsVisiblity(e.target), signal);
    }

    addCustomFiltersFieldEvents(scope, signal) {
        this.addEventListeners(".setting-inp-val", "change", (e) => {
            const id = e.target.getAttribute("data-index");
            this.settings._setSelectedGroupData(id, {value: e.target.value});
        }, signal);

        this.addEventListeners(".setting-inp-key", "keydown", (e) => {
            if (e.key !== "Backspace") {
                e.preventDefault();
            }
        }, signal);
        this.addEventListeners(".setting-inp-key", "keyup", (e) => {
            if (e.key !== "Backspace") {
                e.preventDefault();
            }
            const id = e.target.getAttribute("data-index");
            this.handleInputKeyChange(
                e, 
                this.settings._getSelectedGroupData(id)
            );
        }, signal);

        this.addEventListeners(".setting-inp-key", "click", (e) => e.target.select(), signal);

        this.addEventListeners(".setting-checkbox", "click", (e) => {
            const id = e.target.getAttribute("data-index");
            this.handleCheckboxClick(
                e, 
                this.settings._getSelectedGroupData(id)
            );
        }, signal);

        this.addEventListeners(".content-btn.delete-filter", "click", (e) => {
            const content = document.querySelector("#content-list");
            const scrollPosition = content.scrollTop;
            const id = e.target.getAttribute("data-index");
            const {key, alt} = this.settings.removeGroupSetting(id);
            if (typeof key === "string" && typeof alt === "boolean") {
                this.settings.removeDuplicatedShortcut(key, alt);
            }
            this.renders.updateDOM(scope); 
            this.setEventListeners(scope);
            content.scrollTop = scrollPosition;
        }, signal);

        this.addEventListeners("#new-filter", "click", (e) => {
            const content = document.querySelector("#content-list");
            this.settings.addGroupSetting();
            this.renders.updateDOM(scope);
            this.setEventListeners(scope);
            content.scrollTop = content.scrollHeight;
        }, signal);
    }
}

export { EventManager };