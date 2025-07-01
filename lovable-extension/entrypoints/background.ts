// Chrome extension API declarations
declare const chrome: any;

export default defineBackground(() => {
  console.log('Lovable Dev Assistant background script loaded!', { id: browser.runtime.id });

  // Handle action (extension icon) click
  chrome.action.onClicked.addListener(async (tab: any) => {
    console.log('Extension icon clicked, attempting to open side panel');
    try {
      // Try to open the side panel
      if (chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
        console.log('Side panel opened successfully');
      } else {
        console.error('chrome.sidePanel.open not available');
        // Fallback: Try alternative method
        if (chrome.sidePanel && chrome.sidePanel.setOptions) {
          await chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: 'sidepanel.html',
            enabled: true
          });
          console.log('Side panel enabled via setOptions');
        }
      }
    } catch (error) {
      console.error('Error opening side panel:', error);
      
      // Additional fallback attempts
      try {
        if (chrome.sidePanel && chrome.sidePanel.setOptions) {
          await chrome.sidePanel.setOptions({
            path: 'sidepanel.html',
            enabled: true
          });
          console.log('Side panel enabled globally');
        }
      } catch (fallbackError) {
        console.error('All fallback attempts failed:', fallbackError);
      }
    }
  });

  // Handle messages from content scripts
  chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
    console.log('Background script received message:', request.action);
    
    if (request.action === "scrapeResult") {
      console.group('🤖 Conversation Data from Content Script');
      console.log('👤 User Messages:', request.userMessages);
      console.log('🤖 AI Messages:', request.aiMessages);
      console.log('💬 Merged Messages:', request.mergedMessages);
      console.groupEnd();
      
      sendResponse({ received: true });
    }
    
    if (request.action === 'getBodyHTML') {
      console.log('Background script handling getBodyHTML request');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const tab = tabs[0];
        if (!tab?.id) {
          console.error('No active tab found');
          sendResponse({ error: 'No active tab found' });
          return;
        }
        console.log('Sending message to tab:', tab.id);
        chrome.tabs.sendMessage(tab.id, { action: 'getBodyHTML' }, (response: any) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message to content script:', chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            console.log('Received response from content script:', response ? 'Success' : 'No response');
            sendResponse(response || { error: 'No response from content script' });
          }
        });
      });
      return true; // Indicates async response
    }
    return true;
  });

  // Set up side panel for all tabs - enhanced setup
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed, setting up side panel behavior');
    try {
      if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        console.log('Side panel behavior set to open on action click');
      }
      
      // Also enable the side panel globally
      if (chrome.sidePanel && chrome.sidePanel.setOptions) {
        chrome.sidePanel.setOptions({
          path: 'sidepanel.html',
          enabled: true
        });
        console.log('Side panel enabled globally');
      }
    } catch (error) {
      console.error('Error setting up side panel:', error);
    }
  });
});
