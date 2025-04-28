import { SessionResourceHandler } from "./SessionResourceHandler.js";

class EventManager {
    focusedShape = undefined;
    rightAlt = false;
    lastSelectedClass = null;
    isKeyPressed = false;
    inputHistory = [];

    /** @param {SessionResourceHandler} sessionInstance  */
    constructor(sessionInstance, imageGroup, shapeLayer) {
        this.session = sessionInstance;
        this.imageGroup = imageGroup;
        this.shapeLayer = shapeLayer;
    }

    isEventValid(actionSettings, event) {
        if (!actionSettings || !event || event.key !== actionSettings.key) {
            return false;
        }
        if (!event.altKey && !this.rightAlt && actionSettings.alt) {
            return false;
        } else if ((event.altKey || this.rightAlt) && !actionSettings.alt) {
            return false;
        } else {
            if (event.ctrlKey === false && this.session.getFuncsUserSetting("preventDefault") === true) {
                event.preventDefault();
            }
            return true;
        }
    }

    handleKeyPress(event) {
        if (!event || !event.key || this.isReservedKey(event.key) === true) {
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("navUp"), event)) {
            this.navigateListUp();
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("navDown"), event)) {
            this.navigateListDown();
            return;
        }
        if (this.isKeyPressed === true) {
            return;
        }
        this.isKeyPressed = true;
        if (this.isEventValid(this.session.getMainUserSetting("zTop"), event) && this.focusedShape) {
            this.focusedShape.moveToTop(); // move box to the top (zIndex)
            this.shapeLayer.batchDraw();
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("zBot"), event) && this.focusedShape) {  
            this.focusedShape.moveToBottom(); // move box to the bottom (zIndex)
            this.shapeLayer.batchDraw();
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("quickSearch"), event) && this.focusedShape) {
            this.copyShortProdName();
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("resetAndSearch"), event)) {
            if (event.key === this.session.getMainUserSetting("resetAndSearch").key) {
                event.preventDefault();
            }
            this.searchFor("", true);
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("search"), event)) {
            if (event.key === this.session.getMainUserSetting("search").key) {
                event.preventDefault();
            }
            this.searchFor("...", true);
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("destroyBB"), event)) {
            this.clickElement('button[aria-label="erasing"]', document); 
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("mode"), event)) {
            let clicked = false;
            this.clickElement('button[aria-label="editMode button"]', document, (btn) => {
                if (btn.disabled === true || clicked) return;
                btn.dispatchEvent(new Event("click", {bubbles: true}));
                clicked = true;
            });
            this.clickElement('button[aria-label="drawMode button"]', document, (btn) => {
                if (btn.disabled === true || clicked) return;
                btn.dispatchEvent(new Event("click", {bubbles: true}));
                clicked = true;
            });
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("visiblity"), event)) {
            this.clickElement('button[aria-label="previewRecognized"]', document);
            return;
        }
        if (this.isEventValid(this.session.getMainUserSetting("ettiq"), event)) {
            this.clickElement('button[aria-label="previewLabels"]', document);
            return;
        }
        for (const [key, entry] of Object.entries(this.session.getSelectedCustomGroup())) {
            if (this.isEventValid(this.session.getSelectedCustomGroup()[key], event)) {
                this.searchFor(entry.value);
                return;
            }
        }
        for (const [key, entry] of Object.entries(this.session.getAttrsUserSetting())) {
            if (this.isEventValid(this.session.getAttrsUserSetting(key), event)) { 
                this.changeAttribute(entry.id, entry.type, entry.value);
                return;
            }
        }
    }
    /**
     * @param {string} selector querySelector
     * @param {Element} target 
     * @param {function} customCallback 
     */
    clickElement(selector, target, customCallback) {
        const button = target.querySelector(`${selector}`);
        if (button) {
            if (customCallback) {
                customCallback(button);
            } else {
                button.dispatchEvent(new Event("click", { bubbles: true }));
            }
        }
    }

    navigateListUp() {
        this.navigateList(true);
    }

    navigateListDown() {
        this.navigateList(false);
    }

    navigateList(isUp) {
        const dialog = document.querySelector("mat-dialog-container");
        const classes = document.getElementsByClassName("cdk-virtual-scroll-content-wrapper")[1];
        const getSelectedEl = () => {return document.querySelector(`.selected[role="button"]`)};
        if (!classes || classes.children.length <= 0) {
            return;
        }
        if (dialog !== null && this.isKeyPressed === true) { 
            // cancel firing endlessly only in such case bcs it can speed up navigation and doesn't fire GET requests when dialog is not opened, 
            // but causes issues with GET requests (404) also its not useful at all when dialog modal is open
            return;
        }
        const lastChild = classes.children.length - 1;
        const targetChild = isUp ? 0 : lastChild;
        const sibling = isUp ? 'previousElementSibling' : 'nextElementSibling';

        const repeatClickIfNecessary = () => {
            if (dialog === null && getSelectedEl() && getSelectedEl().nextElementSibling.children[0].children.length <= 0) {
                getSelectedEl().dispatchEvent(new Event("click", { bubbles: true }));
            }
        };
        if (getSelectedEl() && getSelectedEl() !== classes.children[targetChild].children[0]) {
            getSelectedEl().offsetParent[sibling].firstChild.dispatchEvent(new Event("click", { bubbles: true }));
            repeatClickIfNecessary();
            this.isKeyPressed = true;
            return;
        } 
        if (isUp) {
            classes.children[lastChild].firstChild.dispatchEvent(new Event("click", { bubbles: true }));
            repeatClickIfNecessary();
        } else {
            classes.children[0].firstChild.dispatchEvent(new Event("click", { bubbles: true }));
            repeatClickIfNecessary();
        }
        this.isKeyPressed = true;
    }

    hideSelectedClassBlob() {
        const selected = this.lastSelectedClass ? this.lastSelectedClass : document.querySelector(`.selected[role="button"]`);
        if (!selected) {
            return;
        }
        const matElement = selected.offsetParent;
        const expandingDiv = selected.nextElementSibling;
        if (expandingDiv) {
            expandingDiv.style.visibility = "hidden";
            expandingDiv.style.height = "0px";
        }
        if (matElement && matElement.className.includes("mat-expanded")) {
            matElement.classList.remove("mat-expanded", "mat-expansion-panel-spacing");
        }
        selected.ariaDisabled = "true";
        selected.ariaExpanded = "false";
    }

    displaySelectedClassBlob() {
        if (this.lastSelectedClass) {
            const lastBlobRegion = this.lastSelectedClass.nextElementSibling;
            if (lastBlobRegion.style.visibility === "visible" || lastBlobRegion.style.height === "") {
                this.hideSelectedClassBlob();
            }
        }
        const selected = document.querySelector(`.selected[role="button"]`);
        const mat = selected.offsetParent;
        const expandingDiv = selected.nextElementSibling;
        if (selected && selected.nextElementSibling.children[0].children.length <= 0) {
            return;
        }
        expandingDiv.style.visibility = "visible";
        expandingDiv.style.height = "";
        if (mat.className.includes("mat-expanded") === false) {
            mat.classList.add("mat-expanded",  "mat-expansion-panel-spacing");
        }
        selected.ariaDisabled = "false";
        selected.ariaExpanded = "true";
        this.lastSelectedClass = selected;
    }

    destroyTooltip() {
        const tooltipGroups = this.shapeLayer.find(".tooltipGroup");
        if (!tooltipGroups) {
            return;
        }
        for (let i = tooltipGroups.length - 1; i >= 0; --i) {
            const group = tooltipGroups[i];
            group.destroy();
        }
    }

    changeAttribute(index, inputType, value) {
        let input = document.querySelector("input");
        const inputVal = input.value;
        const targetId = this.focusedShape.attrs.id;

        this.clickElement('button[aria-label="objectsButton"]', document);
        input.value = `${this.focusedShape._labelText} ${this.focusedShape._annotationOrdinalNumber}`;
        input.dispatchEvent(new Event("input", { bubbles: true }));

        let parentForm = document.querySelector("attributes-dynamic-form > div > form");
        if (parentForm === null) {
            this.clickElement(`#${CSS.escape(targetId)} > mat-expansion-panel-header[role="button"]`, document);
        }
        // wait for render
        setTimeout(() => {
            if (parentForm === null) {
                parentForm = document.querySelector("attributes-dynamic-form > div > form");
            }
            const targetAttributeForm = parentForm.children[index];
                
            if (inputType === "checkbox") {
                this.clickElement("input", targetAttributeForm);
            } else if (inputType === "input"){
                const attrInput = targetAttributeForm.querySelector("input");
                if (attrInput.value === value) {
                    attrInput.value = "";
                } else {
                    attrInput.value = value;
                }
                attrInput.dispatchEvent(new Event("input", { bubbles: true }));
            } else {
                console.error("Unhandled attribute's input type: ", inputType);
                return;
            }
            this.clickElement('button[aria-label="allButton"]', document);
            input = document.querySelector("input"); //get new visible input
            input.value = inputVal;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }, 40);
    }

    copyShortProdName() {
        const input = document.querySelector("input");
        const type = this.focusedShape._clazzId.split("_")[0];
        input.value = type;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    getLastInputValue(shouldRemove = false) {
        if (this.inputHistory.length === 0) {
            return "...";
        }
        if (shouldRemove === true) {
            return this.inputHistory.shift();
        }
        return this.inputHistory[0];
    }

    savePreviousInputValue(val) {
        if (this.inputHistory.length === 5) {
            this.inputHistory.pop();
            this.inputHistory.unshift(val);
        } 
        else {
            this.inputHistory.unshift(val);
        }
    }

    searchFor(string, keepFocus, savePreviousValue = true) {
        const input = document.querySelector("input");
        if (savePreviousValue === true) {
            this.savePreviousInputValue(input.value);
        }
        if (string.slice(0, 3) === "...") {
            input.value = input.value + string.slice(3);
        } else {
            input.value = string;
        }
        input.dispatchEvent(new Event("input", { bubbles: true }));
        const classes = document.getElementsByClassName("cdk-virtual-scroll-content-wrapper")[1];
        if (classes.offsetParent) {
            classes.offsetParent.scrollTop = 0;
        }
        if (keepFocus) {
            input.focus();
            input.addEventListener("focusout", () => {
                document.getElementsByClassName("konvajs-content")[0].dispatchEvent(new Event("mouseover", { bubbles: true }));
            }, { once: true });
            return;
        }
    }

    isRightAlt(event, keyUp) {
        if (event.key === "AltGraph" && !keyUp) {
            return true;
        } else if (event.key === "AltGraph" && keyUp) {
            return false;
        }
        return this.rightAlt;
    }

    isMouseKeptOnShape(shape, i = 0) {
        let isMouseOver = true;
        const periodInSettings = this.session.getMainUserSetting("displayTTipPeriod").key;
        let period = 3;
        if (
            isNaN(periodInSettings) === false && 
            periodInSettings !== "" && 
            periodInSettings !== null &&
            typeof periodInSettings !== "boolean"
        ) {
            period = Number(periodInSettings);
        }
        return new Promise((resolve) => {
            if (period > 9 || i > 9) {
                resolve(false);
                return;
            }
            shape.on("mouseout", () => {
                isMouseOver = false;
            });
            setTimeout(() => {
                if (i < period && isMouseOver === true) {
                    shape.off("mouseout");
                    resolve(this.isMouseKeptOnShape(shape, i + 1));
                } else {
                    shape.off("mouseout");
                    resolve(isMouseOver);
                }
            }, 100);
        });
    }

    isReservedKey(key) {
        if (this.session.getReservedKeys().includes(key)) {
            return true;
        }
        return false;
    }
}

export { EventManager };