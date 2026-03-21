const dashboardUrl = chrome.runtime.getURL("newtab.html");

// Diese URLs wollen wir abfangen
const targetUrls = [
    "chrome://startpage/",
    "opera://startpage/",
    "chrome://startpageshared/",
    "about:blank"
];

function forceRedirect(tabId, url) {
    if (url && targetUrls.some(target => url.startsWith(target))) {
        chrome.tabs.update(tabId, { url: dashboardUrl });
    }
}

// 1. Check beim Erstellen
chrome.tabs.onCreated.addListener((tab) => {
    forceRedirect(tab.id, tab.pendingUrl || tab.url);
});

// 2. Check beim Aktualisieren (Wichtig für Opera GX!)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "loading" || changeInfo.url) {
        forceRedirect(tabId, tab.url);
    }
});

// 3. Intervall-Check: Falls Opera den Event verschluckt
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab) forceRedirect(tab.id, tab.url);
    });
});