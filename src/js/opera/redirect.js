(function() {
    const dashboardUrl = chrome.runtime.getURL("newtab.html");
    if (window.location.href !== dashboardUrl) {
        window.location.href = dashboardUrl;
    }
})();