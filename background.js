/**
 * Listener - on page load, the extensions triggers the search and sends a message to the background, to set the chrome icon badge
 * green  - the movie was found for the selected streaming service and country
 * yellow - the movie was not found for the selected streaming services, but streams exists for the user's country
 * red    - no result found
 */

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (sender.tab) {
    switch (request.result) {
      case "0":
        chrome.browserAction.setBadgeBackgroundColor({
          tabId: sender.tab.id,
          color: "#00b872",
        });
        chrome.browserAction.setBadgeText({ tabId: sender.tab.id, text: " " });
        break;
      case "1":
        chrome.browserAction.setBadgeBackgroundColor({
          tabId: sender.tab.id,
          color: "#F5C518",
        });
        chrome.browserAction.setBadgeText({ tabId: sender.tab.id, text: " " });
        break;
      case "2":
        chrome.browserAction.setBadgeBackgroundColor({
          tabId: sender.tab.id,
          color: "#fa320a",
        });
        chrome.browserAction.setBadgeText({ tabId: sender.tab.id, text: " " });
        break;
      default:
        chrome.browserAction.setBadgeBackgroundColor({
          tabId: sender.tab.id,
          color: "#FFF",
        });
        chrome.browserAction.setBadgeText({ tabId: sender.tab.id, text: " " });
        break;
    }
  }

  return true;
});
