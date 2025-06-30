// Chrome extension API declarations
declare const chrome: any;

export default defineBackground(() => {
  console.log('Lovable Dev Assistant background script loaded!', { id: browser.runtime.id });

  // Handle action (extension icon) click
  chrome.action.onClicked.addListener(async (tab: any) => {
    try {
      // Open the side panel
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (error) {
      console.error('Error opening side panel:', error);
      
      // Fallback: Try to open sidebar in current tab
      try {
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: 'sidebar.html',
          enabled: true
        });
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  });

  // Set up side panel for all tabs
  chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  });
});
