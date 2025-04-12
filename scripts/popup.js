import { dynamicContent } from "./dynamicContent.js";
import { EventManager } from "./popup/EventManager.js";
import { Renders } from "./popup/Renders.js";
import { SettingsManager } from "./popup/SettingsManager.js";
import { PopupSession } from "./popup/PopupSession.js";

const headerButtons = document.querySelectorAll(".nav.button");
const contentList = document.getElementById("content-list");
const settingsManager = new SettingsManager();
const renderer = new Renders();
const eventManager = new EventManager();
const popup = new PopupSession(settingsManager, renderer, eventManager);

popup._init_().then(() => {
    contentList.innerHTML = dynamicContent._main;
    popup.updateScope("_main");
});

const changeNavSelected = (e) => {
    if (e.target.classList.contains("selected")) {
        return;
    }
    try {
        const current = document.querySelector(".nav.button.selected");
        current.classList.remove("selected");
        e.target.classList.add("selected");
        contentList.innerHTML = dynamicContent[e.target.id];
        popup.updateScope(e.target.id);
    } catch (error) {
        console.error("Error changing navigation:", error);
    }
};

for (const button of headerButtons) {
    button.addEventListener("click", changeNavSelected);
}
