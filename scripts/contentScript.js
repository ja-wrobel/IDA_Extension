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
            return;
        }
        if (e.data === "GET_ENCRYPTION_KEY" && e.source === window && e.origin === location.origin) {
            chrome.runtime.sendMessage({ type: "GET_ENCRYPTION_KEY" }).then( (response) => {
                const key = response?.key || null;
                window.postMessage({ type: "ENCRYPTION_KEY", key: key}, location.origin);
            });
            return;
        }
        if (e.data === "GET_AUTH_TOKEN" && e.source === window && e.origin === location.origin) {
            chrome.runtime.sendMessage({ type: "GET_AUTH_TOKEN" }).then( (response) => {
                const token = response?.token || null;
                const iv = response?.iv || null;
                window.postMessage({ type: "AUTH_TOKEN", token: token, iv: iv }, location.origin);
            });
            return;
        }
        if (e.data && e.data.type === "UPDATE_AUTH_TOKEN") {
            chrome.runtime.sendMessage({ type: "UPDATE_AUTH_TOKEN", token: e.data.token, iv: e.data.iv });
            return;
        }
        if (e.data && e.data.type === "UPDATE_SETTINGS") {
            await chrome.storage.local.set({ userSettings: e.data.settings });
            return;
        }
    } catch (error) {
        console.error("Error accessing chrome.storage:", error);
    }
});

chrome.storage.onChanged.addListener(async () => {
    if (!chrome.runtime?.id) {
        console.warn("Extension context invalidated.");
        document.location.reload();
        return;
    }
    try {
        const settings = await chrome.storage.local.get("userSettings");
        window.postMessage({type: "SETTINGS", settings: settings.userSettings});
    } catch (error) {
        console.error("Error posting updated chrome.storage:", error);
    }
});
