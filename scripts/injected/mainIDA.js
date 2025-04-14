import { EventManager } from "./EventManager.js";
import { Annotations } from "./Annotations.js";
import { Tooltip } from "./Tooltip.js";
import { SessionResourceHandler } from "./SessionResourceHandler.js";
import { EventListeners } from "./EventListeners.js";

(function () {
    const annotations = new Annotations();
    const session = new SessionResourceHandler();

    window.postMessage("GET_SETTINGS");
    window.addEventListener("message", (e) => {
        if (e.data.type === "SETTINGS") {
            session.setUserSettings(e.data.settings);
        }
    });

    const originalOpen = window.XMLHttpRequest.prototype.open;
    const originalSend = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.open = function(method, url) {
        this._requestMethod = method; 
        this._requestURL = url; 
        return originalOpen.apply(this, arguments);
    };

    window.XMLHttpRequest.prototype.send = function(requestBody) {
        const requestMethod = this._requestMethod;
        const requestURL = this._requestURL;

        this.addEventListener("readystatechange", function() {
            if (this.readyState !== 4 || requestURL.includes("/api") === false) {
                return;
            }
            if (requestMethod === "GET" && this.status === 200) {
                annotations.handleInterceptedGETRequest(this, requestURL, session.getProjectName());
                return;
            }
            if (requestMethod === "POST" && (this.status === 200 || this.status === 202)){
                if (this.status === 200 && this.getResponseHeader("Authorization") !== null) {
                    session.setAuthToken(this.getResponseHeader("Authorization"));
                    return;
                }
            }
            if (requestMethod === "PATCH" && this.status === 202) {
                annotations.handleInterceptedPATCHRequest(this, requestBody, requestURL);
                return;
            }
            if (requestMethod === "DELETE" && this.status === 202) {
                annotations.handleInterceptedDELETERequest(this, requestBody, requestURL);
                return;
            }
        });
        return originalSend.apply(this, arguments);
    };

    const originalCreateObjectURL = URL.createObjectURL;
    
    URL.createObjectURL = function(blob) {
        const blobURL = originalCreateObjectURL.call(this, blob);
        session.setLastInterceptedBlob(blobURL);
        return blobURL;
    };

    const pushState = history.pushState;

    history.pushState = function (...args) {
        const ret = pushState.apply(this, args);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    };
    
    const replaceState = history.replaceState;

    history.replaceState = function (...args) {
        const ret = replaceState.apply(this, args);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    };
    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
    });

    const eventListeners = new EventListeners();

    function mainIDA() {
        session.waitForResources(annotations).then((Konva) => {
            const latestStageIndex = Konva.stages.length - 1;
            const imageGroup = Konva.stages[latestStageIndex].children[1].children[0];
            const shapeLayer = Konva.stages[latestStageIndex].children[1];
            const classesList = document.getElementsByClassName("cdk-virtual-scroll-content-wrapper")[1];
            const eventManager = new EventManager(session, imageGroup, shapeLayer);

            if (eventListeners.callbacks.size > 0) {
                eventListeners.removeAll(["click"], classesList);
                eventListeners.removeAll(["click", "mousedown", "mouseout", "mouseover"], imageGroup);
                eventListeners.removeAll(["keydown", "keyup"], document);
            }

            eventListeners.add(["click"], classesList, (e) => { // handles bugged displaying of blobs in classes list
                const targetIncludesSelected = e.target.className.includes("selected");
                const childIncludesSelected = !!(e.target.children[0] && e.target.children[0].className.includes("selected"));
                const parentIncludesSelected = !!(e.target.offsetParent && e.target.offsetParent.className.includes("selected"));
                if (targetIncludesSelected || childIncludesSelected || parentIncludesSelected) {
                    eventManager.displaySelectedClassBlob();
                    return;
                }
                eventManager.hideSelectedClassBlob();
            });

            eventListeners.add([`click`], imageGroup, (e) => { 
                eventManager.hideSelectedClassBlob();
                eventManager.focusedShape = e.target.parent;
            });

            eventListeners.add(["mousedown", "mouseout"], imageGroup, () => {
                eventManager.destroyTooltip();
            });

            eventListeners.add(["mouseover"], imageGroup, async (e) => {
                if (!e || !e.target || !e.target.parent) {
                    return;
                }
                eventManager.isMouseKeptOnShape(e.target).then(async (bool) => {
                    if (bool === false) {
                        return;
                    }
                    const blobData = await session.getImageForShape(e.target.parent);
                    const tooltip = new Tooltip(e, blobData, session.getMainUserSetting("tooltipSize").key);
                    if (!tooltip.blobData || !tooltip.shape) {
                        return;
                    }
                    if (session.getFuncsUserSetting("showAttributes") === true) {
                        const attributes = annotations.getAttributesObject(e.target);
                        const showGrammage = session.getFuncsUserSetting("showGrammage");
                        tooltip.createTooltipText(attributes, showGrammage);
                    }
                    shapeLayer.add(tooltip.getTooltip());
                    tooltip.setTooltipPosition();
                    shapeLayer.batchDraw();
                    tooltip.getTooltip().on("mouseenter", () => {
                        eventManager.destroyTooltip();
                    });
                });
            });

            eventListeners.add(["keydown"], document, (e) => {
                if (e.key === "Alt" || e.key === "AltGraph" || e.key === "Control") {
                    if (e.ctrlKey === false && session.getFuncsUserSetting("preventDefault") === true) {
                        e.preventDefault();
                    }
                    eventManager.rightAlt = eventManager.isRightAlt(e);
                    return;
                }
                if (session.getFuncsUserSetting("navByArrows") && e.key === "ArrowUp") { 
                    e.preventDefault();
                    eventManager.navigateListUp();
                    return;
                }
                if (session.getFuncsUserSetting("navByArrows") && e.key === "ArrowDown") { 
                    e.preventDefault();
                    eventManager.navigateListDown();
                    return;
                }
                if (document.activeElement.nodeName === "INPUT") { 
                    return;
                }
                eventManager.handleKeyPress(e); // in keydown bcs it's more convenient in use for keyboard shortucts with alt
            });

            eventListeners.add(["keyup"], document, (e) => {
                eventManager.rightAlt = eventManager.isRightAlt(e, true);
                eventManager.isKeyPressed = false;
            });

        }).catch((error) => {
            console.error("IDA extension failed: ", error);
        });
    };

    function cleanUp() {
        const classesList = document.getElementsByClassName("cdk-virtual-scroll-content-wrapper")[1];
        if (classesList !== undefined) {
            eventListeners.removeAll(["click"], classesList);
        }
        if (session.isKonvaValid() === true) {
            for (let i = 0; i < window.Konva.stages.length; ++i) {
                if (session.isStageValid(i) === false) {
                    continue;
                }
                const imageGroup = window.Konva.stages[i].children[1].children[0];
                eventListeners.removeAll(["click", "mousedown", "mouseout", "mouseover"], imageGroup);
            }
        }
        eventListeners.removeAll(["keydown", "keyup"], document);
        annotations.deleteAllAnnotations();
    }

    // EXE
    window.addEventListener("locationchange", () => {
        if (session.getFuncsUserSetting("isOff")) {
            session.deleteKnownBlobs();
            cleanUp();
            return;
        }
        if (session.isUserInIDAEditor() === false) {
            cleanUp();
            return;
        }
        if (session.isUserInIDAEditor() === true) {
            session.refreshAuthToken();
            mainIDA();
        }
    });
    window.addEventListener("attributesupdate", () => {
        session.patchAttributesData(annotations.getAttributeTypes())
    });
})()