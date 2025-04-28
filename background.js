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
        tooltipSize: {key: 18}
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

chrome.storage.local.get("userSettings").then((data) => {
    if (
        data.userSettings === undefined ||
        data.userSettings._main === undefined || 
        data.userSettings._custom === undefined ||
        data.userSettings._attrs === undefined ||
        data.userSettings._funcs === undefined
    ) {
        chrome.storage.local.set({ userSettings: InitialSettings });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_AUTH_TOKEN") {
        (async () => {
            const token = await chrome.storage.session.get("authToken");
            const iv = await chrome.storage.session.get("encryptionIV");
            const salt = await chrome.storage.session.get("salt");
            sendResponse({ token: token.authToken || null, iv: iv.encryptionIV || null, salt: salt.salt || null });
        })();
        return true;
    } 
    else if (message.type === "UPDATE_AUTH_TOKEN") {
        chrome.storage.session.set({ authToken: message.token });
        chrome.storage.session.set({ encryptionIV: message.iv });
        chrome.storage.session.set({ salt: message.salt });
    }
    return false;
});
