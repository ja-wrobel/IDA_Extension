function injectScript(file) {
    const script = document.createElement("script");
    script.type = "module";
    script.src = chrome.runtime.getURL(file);
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

injectScript("./scripts/injected/CryptoManager.js");
injectScript("./scripts/injected/KonvaMaths.js");
injectScript("./scripts/injected/EventManager.js");
injectScript("./scripts/injected/Annotations.js");
injectScript("./scripts/injected/TooltipSize.js");
injectScript("./scripts/injected/Tooltip.js");
injectScript("./scripts/injected/SessionResourceHandler.js");
injectScript("./scripts/injected/EventListeners.js");
injectScript("./scripts/injected/mainIDA.js");

window.addEventListener("message", async (e) => {
    if (!chrome.runtime?.id) {
        console.warn("Extension context invalidated.");
        document.location.reload();
        return;
    }
    try {
        if (e.data === "GET_SETTINGS") {
            const settings = await chrome.storage.local.get("userSettings");
            window.postMessage({ type: "SETTINGS", settings: settings.userSettings });
        }
        if (e.data === "GET_ID" && e.source === window && e.origin === location.origin) {
            const extensionId = chrome.runtime.id || null;
            window.postMessage({ type: "EXT_ID", id: extensionId }, location.origin);
        }
        if (e.data === "GET_AUTH_TOKEN" && e.source === window && e.origin === location.origin) {
            chrome.runtime.sendMessage({ type: "GET_AUTH_TOKEN" }).then( (response) => {
                const token = response?.token || null;
                const iv = response?.iv || null;
                const salt = response?.salt || null;
                window.postMessage({ type: "AUTH_TOKEN", token: token, iv: iv, salt: salt }, location.origin);
            });
        }
        if (e.data && e.data.type === "UPDATE_AUTH_TOKEN") {
            chrome.runtime.sendMessage({ type: "UPDATE_AUTH_TOKEN", token: e.data.token, iv: e.data.iv, salt: e.data.salt });
        }
        if (e.data && e.data.type === "UPDATE_SETTINGS") {
            chrome.storage.local.set({ userSettings: e.data.settings });
        }
    } catch (error) {
        console.error("Error accessing chrome.storage:", error);
    }
});

chrome.storage.onChanged.addListener(async (changes, storageType) => {
    if (storageType === "local" && changes.userSettings) {
        window.postMessage({ type: "SETTINGS", settings: changes.userSettings.newValue });
    }
});
