class SessionResourceHandler {
    constructor() {
        this.authToken = null;
        this.userSettings = {};
        this.knownClassBlobs = {};
        this.lastInterceptedBlob = null;
    }
        
    setUserSettings(settings) {
        Object.assign(this.userSettings, settings);
    }
    /** @returns {object|null} */
    getSelectedCustomGroup() {
        if (!this.userSettings._custom || this.userSettings._custom.length < 1) {
            return null;
        }
        return this.userSettings._custom[this.userSettings.selectedGroupId].data;
    }
    /** @returns {boolean|undefined|null} @param {string} settingName  */
    getFuncsUserSetting(settingName) {
        return this.userSettings._funcs[settingName];
    }
    /** @returns {object|undefined|null} @param {string} settingName  */
    getMainUserSetting(settingName) {
        return this.userSettings._main[settingName];
    }
    /** @returns {object|undefined|null} @param {string} attrName  */
    getAttrsUserSetting(attrName) {
        const projectName = this.getProjectName();
        if (!this.userSettings._attrs || !this.userSettings._attrs[projectName]) {
            return null;
        }
        if (!attrName) {
            return this.userSettings._attrs[projectName];
        }
        return this.userSettings._attrs[projectName][attrName];
    }
    /** @returns {Array} */
    getReservedKeys() {
        return this.userSettings.reservedKeys;
    }

    setAuthToken(token) {
        const authSettingRef = this.getMainUserSetting("authToken");
        if (!token || token === "" || !authSettingRef) {
            return;
        }
        this.authToken = token;
        authSettingRef.key = token;
        window.postMessage({type: "UPDATE_SETTINGS", settings: this.userSettings});
    }

    setLastInterceptedBlob(blob) {
        this.lastInterceptedBlob = blob;
    }

    getHeadersForMethod(method, body) {
        let defaultBody = null;

        if (method === "POST") {
            defaultBody = "{}";
        }
        return {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "pl,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
                "authorization": this.authToken ? this.authToken : this.getMainUserSetting("authToken").key,
                "origin": document.location.origin,
                "priority": "u=1, i",
                "sec-ch-ua": navigator.userAgentData?.brands?.map(brand => `${brand.brand};v="${brand.version}"`).join(", ") || navigator.userAgent,
                "sec-ch-ua-mobile": navigator.userAgentData?.mobile ? "?1" : "?0",
                "sec-ch-ua-platform": `"${navigator.userAgentData?.platform || "Windows"}"`,
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": document.location.href,
            "referrerPolicy": "strict-origin-when-cross-origin",
            "User-Agent": navigator.userAgent,
            "body": body || defaultBody,
            "method": method,
            "mode": "cors",
            "credentials": "include"
        };
    }

    fetchWithRetry(url, options, retries = 3) {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetch(url, options).then((response) => {
                    if (response.status === 400 && retries > 0) {
                        resolve(this.fetchWithRetry(url, options, retries - 1));
                    }
                    resolve(response);
                });
            }, 200);
        });
    }

    refreshAuthToken() {
        this.fetchWithRetry(`${document.location.origin}/api/tokens/refresh_token`, this.getHeadersForMethod("POST"))
            .then((response) => response.headers)
            .then((headers) => this.setAuthToken(headers.get("Authorization")));
    }

    waitForResources(annotations, i = 0) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const mainResources = !!(this.isKonvaValid() === true && this.userSettings._main);
                const attributeTypes = !!(annotations.attributeTypesSet === true || this.userSettings._attrs[this.getProjectName()]);
                if (mainResources === true && attributeTypes === true) {
                    resolve(window.Konva);
                } 
                else if (i < 20) {
                    resolve(this.waitForResources(annotations, i + 1));
                } 
                else if (i >= 20 && mainResources === true) {
                    resolve(window.Konva);
                } 
                else {
                    reject("No Konva or user settings ;/");
                }
            }, 200);
        });
    }

    getProjectName() {
        return document.location.pathname.split("/")[3];
    }
    /** @returns {Promise<object> | null} */
    async getImageForShape(shape) {
        if (!this.authToken || !shape || !shape._clazzId || shape._clazzId.includes("NotRec")) {
            return null;
        }
        if (this.knownClassBlobs[shape._clazzId]) {
            const classId = shape._clazzId;
            if (!this.getFuncsUserSetting("informWhenMoreBlobs") && this.knownClassBlobs[classId].moreBlobs === true) {
                this.knownClassBlobs[classId].moreBlobs = false;
            }
            return this.knownClassBlobs[classId];
        }
        const currentBlob = this.lastInterceptedBlob;
        const projectName = this.getProjectName();
        const classId = shape._clazzId;
        const color = shape._color;
        const standardsURL = `${document.location.origin}/api/projects/${projectName}/classes/${classId}/standards`;
        const headers = this.getHeadersForMethod("GET");
        let moreThanOneBlob = false;

        const fileURL = await fetch(standardsURL, headers)
            .then((response) => response.json())
            .then((data) => {
                if (data[0] === undefined) {
                    return null;
                }
                if (data.length > 1 && this.getFuncsUserSetting("informWhenMoreBlobs") === true) {
                    moreThanOneBlob = true;
                }
                return data[0].links[1].href;
            });
        if (fileURL === null) {
            return null;
        }
        return await fetch(fileURL, headers)
            .then(async (response) => {
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        if (currentBlob === this.lastInterceptedBlob) {
                            console.error("Didn't load new blob from: ", fileURL);
                            resolve(null);
                        } else {
                            this.knownClassBlobs[classId] = {
                                blob: this.lastInterceptedBlob,
                                width: img.naturalWidth,
                                height: img.naturalHeight,
                                color: color,
                                moreBlobs: moreThanOneBlob
                            };
                            resolve(this.knownClassBlobs[classId]);
                        }
                    };
                    img.onerror = () => {
                        console.error("Error loading image blob");
                        resolve(null);
                    };
                    img.src = URL.createObjectURL(blob);
                });
            })
            .catch((error) => {
                console.error("File Fetch Error", error);
                return null;
            });
    }

    deleteKnownBlobs() {
        this.knownClassBlobs = {};
    }

    isUserInIDAEditor() {
        const UUID = document.location.pathname.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return document.location.href.includes(`editor`) && UUID !== null;
    }

    isKonvaValid() {
        if (!window.Konva || !window.Konva.stages) {
            return false;
        }
        const latestStageIndex = window.Konva.stages.length - 1;
        const latestStage = window.Konva.stages[latestStageIndex];
        if (!latestStage || !latestStage.children[1] || !latestStage.children[1].children[0]) {
            return false;
        }
        return true;
    }

    isStageValid(id) {
        const stage = window.Konva.stages[id];
        if (!stage || !stage.children[1] || !stage.children[1].children[0]) {
            return false;
        }
        return true;
    }

    patchAttributesData(attributesObj) {
        const projectName = this.getProjectName();
        if (!this.userSettings._attrs || !attributesObj || !attributesObj[0]) {
            return;
        }
        if (!this.userSettings._attrs[projectName]) {
            this.userSettings._attrs[projectName] = {};
        }
        for (let i = 0; i < attributesObj.length; ++i) {
            let attributeName, attributeType;
            
            if (!attributesObj[i].attributeType) {
                attributeName = attributesObj[i].name;
                attributeType = attributesObj[i].inputType.toLowerCase();
            } else {
                attributeName = attributesObj[i].attributeType.name;
                attributeType = attributesObj[i].attributeType.inputType.toLowerCase();
            }
            if (this.userSettings._attrs[projectName][attributeName]) {
                continue;
            }
            this.userSettings._attrs[projectName][attributeName] = {
                id: i,
                type: attributeType,
                value: "",
                key: "",
                alt: false
            };
        }
        window.postMessage({type: "UPDATE_SETTINGS", settings: this.userSettings});
    }
}

export { SessionResourceHandler };