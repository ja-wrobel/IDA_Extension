class Renders {

    _init_(settings) {
        this.settings = settings;
    }

    updateDOM(scope) {
        switch(scope) {
            case "_custom":
                this.updateCustomDOM();
                break;
            case "_funcs":
                this.updateFuncsDOM();
                break;
            case "_attrs":
                this.updateAttrsDOM();
                break;
            default:
                this.updateMainDOM();
                break;
        }
        document.querySelectorAll(".setting-inp-key").forEach( input => {
            const siblingCheckbox = this.getSiblingCheckbox(input);
            if (siblingCheckbox === null) {
                return;
            }
            this.settings.searchForNewDuplicates(input.value, siblingCheckbox.checked);
        });
        this.highlightDuplicatedKeys();
    }

    updateMainDOM() {
        document.querySelectorAll(".setting-inp-key").forEach(input => {
            input.value = this.settings._getMainSettings(input.name).key;
        });
        document.querySelectorAll(".setting-checkbox").forEach(checkbox => {
            checkbox.checked = this.settings._getMainSettings(checkbox.name).alt;
        });
        document.getElementById(this.settings._getMainSettings("tooltipSize").key).classList.add("selected");
    }

    updateCustomDOM() {
        const contentField = document.getElementById("dynamic-filters");
        const groupsField = document.getElementById("dynamic-groups");
        const contentList = document.getElementById("content-list");
        contentField.innerHTML = "";
        groupsField.innerHTML = "";
        for (let i = 0; i < this.settings._getCustomSettings().length; ++i) {
            this.renderCustomGroup(
                i, 
                this.settings._getCustomSettings(i).name, 
                this.settings._getSelectedGroupName()
            );
        }
        if (this.settings._getCustomSettings().length > 0) {
            for (let i = 0; i < this.settings._getSelectedGroupData().length; ++i) {
                this.renderCustomField(
                    i, 
                    this.settings._getSelectedGroupData(i)
                );
            }
        }
        this.handleCustomNavbar(
            this.settings._getCustomSettings().length
        );
        contentList.scrollTop = 0;
    }

    updateFuncsDOM() {
        document.querySelectorAll(".setting-checkbox").forEach(checkbox => {
            checkbox.checked = this.settings._getFuncsSettings(checkbox.name);
        });
    }

    updateAttrsDOM() {
        const projectNameField = document.getElementById("project-name");
        projectNameField.innerHTML = this.settings.currentProjectName;
        if (this.settings.isValidProject === false) {
            return;
        }
        for (const key of Object.keys(this.settings._getAttrsSettings())) {
            this.renderAttributeField(key, this.settings._getAttrsSettings(key));
        }
    }

    renderCustomField(index, contents) {
        const fields = document.getElementById("dynamic-filters");
        fields.innerHTML += `
            <div class="setting" data-index="${index}">
                <input 
                    title='Użyj "..." na początku aby skrót dodał resztę treści do uprzednio wpisanej np. - "... 200g"' 
                    class="setting-inp-val" 
                    type="text" 
                    data-index="${index}" 
                    value="${contents.value}"
                >
                <input class="setting-inp-key" data-index="${index}" maxlength="1" type="text" value="${contents.key}">
                <input class="setting-checkbox" type="checkbox" data-index="${index}" ${contents.alt === true ? "checked" : ""}>
                <button type="button" class="content-btn delete-filter" data-index="${index}">-</button>
            </div>
        `;
    }

    renderCustomGroup(index, name, selectedGroupName) {
        const groupsField = document.getElementById("dynamic-groups");
        groupsField.innerHTML += `
            <button 
                type="button"
                class="groups-nav-btn ${selectedGroupName === name ? "selected" : ""}" 
                data-name="${name}"
                data-index="${index}"
            >
            ${name}
            </button>
        `;
    }

    renderAttributeField(attrType, attrContents) {
        const attrsField = document.getElementById("dynamic-attributes");
        if (attrContents.type === "text") {
            attrsField.innerHTML += `
                <div class="setting flex-col">
                    <p class="setting-title">${attrType}</p>
                    <div class="flex-row">
                        <input 
                            placeholder="Wartość"
                            class="setting-inp-val wide-inp" 
                            type="text" 
                            data-name="${attrType}"
                            value="${attrContents.value}"
                        >
                        <input
                            placeholder="a"
                            class="setting-inp-key"
                            type="text"
                            data-name="${attrType}"
                            value="${attrContents.key}"
                        >
                        <input
                            title="Alt"
                            class="setting-checkbox"
                            type="checkbox"
                            data-name="${attrType}"
                            ${attrContents.alt === true ? "checked" : ""}
                        >
                    </div>
                </div>
            `;
            return;
        }
        const attrTypeAsId = this.sanitizeForId(attrType);
        attrsField.innerHTML += `
            <div class="setting">
                <label class="setting-label" for="${attrTypeAsId}">${attrType}: 
                    <input 
                        class="setting-inp-key" 
                        data-name="${attrType}" 
                        id="${attrTypeAsId}" 
                        maxlength="1" 
                        type="text" 
                        value="${attrContents.key}"
                    >
                </label>
                <input class="setting-checkbox" type="checkbox" data-name="${attrType}" ${attrContents.alt === true ? "checked" : ""}>
            </div>
        `;
    }

    handleCustomNavbar(_customLength) {
        if (_customLength < 1) {
            return;
        }
        const selected = document.querySelector(".groups-nav-btn.selected");
        const contentList = document.getElementById("content-list");
        selected.scrollIntoView({inline: "center"});
        contentList.scrollLeft = 0;
        this.hideArrows();
    }

    sanitizeForId(inputString) {
        return inputString
            .replace(/[^a-zA-Z0-9-_:.]/g, '-')
            .replace(/^[^a-zA-Z]+/, '');
    }

    hideArrows() {
        const contentFieldPos = document.getElementById("content-list").scrollTop;
        const groupsField = document.getElementById("dynamic-groups");
        const leftNavArrow = document.getElementById("nav-left");
        const rightNavArrow = document.getElementById("nav-right");
        const scrollWidth = groupsField.scrollWidth;
        const currentScrollPos = groupsField.scrollLeft;
        const clientWidth = groupsField.clientWidth;

        if (currentScrollPos === 0 || contentFieldPos !== 0) {
            leftNavArrow.classList.add("hidden");
        } else {
            leftNavArrow.classList.remove("hidden");
        }
        if (currentScrollPos + 1 >= scrollWidth - clientWidth || contentFieldPos !== 0) {
            rightNavArrow.classList.add("hidden");
        } else {
            rightNavArrow.classList.remove("hidden");
        }
    }

    handleGroupButtonsVisiblity(el) {
        if (el.getAttribute("id") === "import-group") {
            el.nextElementSibling.classList.add("hide-r");
            el.classList.add("hide-r");
            el.previousElementSibling.classList.add("hide-r");
            el.previousElementSibling.previousElementSibling.classList.remove("hide-l");
        }
        if (el.getAttribute("id") === "import-group-canc") {
            const parent = el.parentElement;
            parent.nextElementSibling.nextElementSibling.nextElementSibling.classList.remove("hide-r");
            parent.nextElementSibling.nextElementSibling.classList.remove("hide-r");
            parent.nextElementSibling.classList.remove("hide-r");
            parent.classList.add("hide-l");
        }
    }

    highlightDuplicatedKeys() {
        document.querySelectorAll(".setting-inp-key").forEach(input => {
            const key = input.value;
            const siblingCheckbox = this.getSiblingCheckbox(input);
            if (siblingCheckbox === null) {
                return;
            }
            const alt = siblingCheckbox.checked;
            const duplicateId = this.settings.findInDuplicates(key, alt);
            if (duplicateId !== null && input.classList.contains("highlighted") === false) {
                input.classList.add("highlighted");
                return;
            }
            if (duplicateId === null && input.classList.contains("highlighted") === true) {
                input.classList.remove("highlighted");
            }
        });
    }

    getSiblingCheckbox(input) {
        const name = input.getAttribute("data-name");
        const index = input.getAttribute("data-index");
        if (name !== null) {
            return document.querySelector(`.setting-checkbox[data-name="${name}"]`);
        } else if (index !== null) {
            return document.querySelector(`.setting-checkbox[data-index="${index}"]`);
        } else {
            return null;
        }
    }
}

export { Renders };