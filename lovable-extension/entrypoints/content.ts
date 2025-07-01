import { logConversationToConsole } from '../utils/promptResponseScraper';

// Chrome extension API types
declare const chrome: any;

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('🚀 Lovable Extension Content Script Loaded');
    
    // Auto-scrape conversation data when page loads
    setTimeout(async () => {
      try {
        console.log('🔍 Attempting to scrape conversation data...');
        await logConversationToConsole();
      } catch (error) {
        console.log('ℹ️ No conversation data found on this page, which is normal for non-chat pages');
      }
    }, 2000); // Wait 2 seconds for page to fully load

    // Listen for messages from popup/sidepanel
    chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
      console.log('Content script received message:', request.action);
      
      if (request.action === "getBodyHTML") {
        console.log('Content script responding with body HTML');
        sendResponse({ html: document.body.outerHTML });
        return true; // Indicates async response
      }
      
      if (request.action === "startScraping") {
        logConversationToConsole()
          .then((data) => {
            sendResponse({ success: true, data });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true; // Will respond asynchronously
      }
    });
  },
});
