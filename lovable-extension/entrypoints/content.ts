// Chrome extension API types
declare const chrome: any;

export default defineContentScript({
  matches: [
    '*://*.claude.ai/*', 
    '*://*.chatgpt.com/*', 
    '*://*.anthropic.com/*',
    '*://*.openai.com/*',
    '*://*.poe.com/*',
    '*://*.character.ai/*',
    '*://*.huggingface.co/*',
    '*://*.perplexity.ai/*',
    '*://*.bard.google.com/*',
    '*://*.bing.com/chat*',
    '<all_urls>' // Allow testing on any site
  ],
  main(ctx: any) {
    // Suppress specific React warnings in development
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (args[0]?.includes?.('findDOMNode is deprecated')) {
          return; // Suppress findDOMNode warnings from external libraries
        }
        originalWarn.apply(console, args);
      };
    }

    // Auto-run the scraper when content script loads
    console.log('🚀 Lovable extension content script MAIN function started on:', window.location.href);
    console.log('🚀 CONTENT SCRIPT - Chrome runtime available:', !!chrome?.runtime);
    
    // Test basic functionality immediately
    try {
      console.log('📄 Page title:', document.title);
      console.log('🌐 Current URL:', window.location.href);
      console.log('📊 DOM ready state:', document.readyState);
    } catch (error) {
      console.error('❌ Basic test failed:', error);
    }
    
    // Set up periodic scraping
    const intervalId = setInterval(async () => {
      try {
        const { scrapeConversationFromDOM } = await import('../utils/promptResponseScraper');
        const conversation = scrapeConversationFromDOM();
        
        if (conversation && conversation.mergedMessages.length > 0) {
          console.log('📝 Scraped conversation data:', conversation);
        }
      } catch (error) {
        console.error('❌ Error scraping conversation:', error);
      }
    }, 5000); // Check every 5 seconds

    // Clean up interval when context is invalidated
    ctx.onInvalidated(() => {
      console.log('🔄 Content script context invalidated, cleaning up...');
      clearInterval(intervalId);
    });

    // Listen for messages from popup/sidepanel
    chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
      console.log('📨 Content script received message:', request.action, 'from:', sender);
      
      if (request.action === "getBodyHTML") {
        console.log('Content script responding with body HTML');
        sendResponse({ html: document.body.outerHTML });
        return true; // Indicates async response
      }
      
      if (request.action === "startScraping") {
        console.log('🔍 Starting scraping process...');
        // Handle async import properly
        (async () => {
          try {
            const { scrapeConversationFromDOM } = await import('../utils/promptResponseScraper');
            const data = scrapeConversationFromDOM();
            console.log('🔍 Content script scraped data:', data);
            sendResponse({ success: true, data });
          } catch (error) {
            console.error('❌ Content script scraping error:', error);
            sendResponse({ success: false, error: (error as Error).message });
          }
        })();
        return true; // Will respond asynchronously
      }
      
      // Test ping message
      if (request.action === "ping") {
        console.log('🏓 Ping received, sending pong...');
        sendResponse({ pong: true, url: window.location.href, timestamp: Date.now() });
        return true;
      }
    });

    // Announce that content script is fully loaded and ready
    console.log('✅ Content script fully initialized and ready for messages');
  },
});
