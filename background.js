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
        tooltipSize: {key: "medium"},
        authToken: {key: ""}
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
