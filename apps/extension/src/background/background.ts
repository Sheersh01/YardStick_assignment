// Background service worker for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Universal SaaS Copilot installed.');
});

// Listen for requests from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_DSC_COOKIE') {
    chrome.cookies.get({ url: 'https://trello.com', name: 'dsc' }).then(cookie => {
      sendResponse({ dsc: cookie ? cookie.value : null });
    });
    return true; // Keep message channel open
  }
});
