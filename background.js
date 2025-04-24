const InitialSettings = {
    selectedGroupId: 0,
    _main: {
        resetAndSearch: {key: "`", alt: false},
        search: {key: "`", alt: true},
        zTop: {key: "w", alt: true},
        zBot: {key: "e", alt: true},
        quickSearch: {key: "r", alt: false},
        navUp: {key: "w", alt: false},
        navDown: {key: "e", alt: false},
        destroyBB: {key: "q", alt: true},
        mode: {key: "q", alt: false},
        visiblity: {key: "x", alt: false},
        ettiq: {key: "c", alt: false},
        displayTTipPeriod: {key: "0"},
        tooltipSize: {key: "medium"}
    },
    _custom: [
        {
            name: "Grupa 1",
            data: [
                {key: "", value: "", alt: false}
            ]
        }
    ],
    _attrs: {
        
    },
    _funcs: {
        isOff: false,
        showTTip: true,
        navByArrows: true,
        showAttributes: true,
        showGrammage: true,
        informWhenMoreBlobs: true,
        preventDefault: true,
        showWarningOnGroupDelete: true
    },
    reservedKeys: ['z', 'v', 'n', 'a', 's', 'd', 'i', 'm', 'u', 'f'],
    duplicates: [
        {
            defaults: []
        }
    ],
    onlyMainDuplicates: {
        defaults: []
    }
};

chrome.storage.local.get("userSettings").then((settings) => {
    if (!settings._main) {
        chrome.storage.local.set({ userSettings: InitialSettings });
    }
});

async function generateKey() {
    return await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_ENCRYPTION_KEY") {
        (async () => {
            const key = await chrome.storage.session.get("encryptionKey");
            if (!key.encryptionKey) {
                const newKey = await generateKey();
                const exportedKey = await crypto.subtle.exportKey("jwk", newKey);
                await chrome.storage.session.set({ encryptionKey: exportedKey });
                sendResponse({ key: exportedKey });
            } else {
                sendResponse({ key: key.encryptionKey});
            }
        })();
        return true;
    } 
    else if (message.type === "GET_AUTH_TOKEN") {
        (async () => {
            const token = await chrome.storage.session.get("authToken");
            const iv = await chrome.storage.session.get("encryptionIV");
            sendResponse({ token: token.authToken || null, iv: iv.encryptionIV || null });
        })();
        return true;
    } 
    else if (message.type === "UPDATE_AUTH_TOKEN") {
        chrome.storage.session.set({ authToken: message.token });
        chrome.storage.session.set({ encryptionIV: message.iv });
    }
    return false;
});
