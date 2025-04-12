function injectScript(file) {
    const script = document.createElement("script");
    script.type = "module";
    script.src = chrome.runtime.getURL(file);
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

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
        if (e.data && e.data.type === "UPDATE_SETTINGS") {
            await chrome.storage.local.set({ userSettings: e.data.settings });
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
