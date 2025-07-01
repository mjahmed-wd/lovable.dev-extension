const chrome = (window as any).chrome;

export interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export interface ConversationData {
  userMessages: Message[];
  aiMessages: Message[];
  mergedMessages: Message[];
  url?: string;
  title?: string;
}

/**
 * Scrapes conversation data directly from the DOM (for use in content scripts)
 */
export const scrapeConversationFromDOM = (): ConversationData => {
  // Get user messages
  const userMessageDivs = Array.from(
    document.querySelectorAll('div[data-message-id^="umsg_01"]')
  );

  const userMessages: Message[] = [];
  userMessageDivs.forEach((userMessageDiv) => {
    const userText = userMessageDiv.textContent?.trim();

    // Skip empty or invisible elements
    if (!userText) return;

    userMessages.push({
      sender: "user",
      text: userText,
    });
  });

  // Get AI messages
  const allAIDivs = Array.from(
    document.querySelectorAll(
      'div[data-message-id^="aimsg_01"] > div:nth-child(2)'
    )
  );

  const aiMessagesMap = new Map<string, Message>();
  allAIDivs.forEach((el) => {
    const text = (el as HTMLElement).innerText?.trim();

    // Skip empty or invisible elements
    if (!text) return;
    
    if (!aiMessagesMap.has(text)) {
      aiMessagesMap.set(text, { sender: "ai", text: text });
    }
  });

  const aiMessages = Array.from(aiMessagesMap.values());

  // Merge user and AI messages alternately
  const mergedMessages: Message[] = [];
  const maxLength = Math.max(userMessages.length, aiMessages.length);

  for (let i = 0; i < maxLength; i++) {
    if (userMessages[i]) mergedMessages.push(userMessages[i]);
    if (aiMessages[i]) mergedMessages.push(aiMessages[i]);
  }

  return {
    userMessages,
    aiMessages,
    mergedMessages,
    url: window.location.href,
    title: document.title,
  };
};

/**
 * Scrapes conversation data from the current page (for use in background/popup scripts)
 * Supports Claude and similar chat interfaces
 */
export const scrapeConversation = async (): Promise<ConversationData> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeConversationFromDOM,
    });

    return result[0].result as ConversationData;
  } catch (error) {
    console.error('Error scraping conversation:', error);
    throw new Error('Failed to scrape conversation data.');
  }
};

/**
 * Generic scraper that attempts to find conversation patterns on any page (for content scripts)
 */
export const scrapeGenericConversationFromDOM = (): ConversationData => {
  // Common selectors for chat applications
  const commonUserSelectors = [
    '[data-message-author-role="user"]',
    '[data-role="user"]',
    '.user-message',
    '.human-message',
    '[data-testid*="user"]',
    '[class*="user"]',
    '[data-message-id^="umsg"]'
  ];

  const commonAISelectors = [
    '[data-message-author-role="assistant"]',
    '[data-role="assistant"]',
    '.ai-message',
    '.assistant-message',
    '.bot-message',
    '[data-testid*="assistant"]',
    '[class*="assistant"]',
    '[data-message-id^="aimsg"]'
  ];

  const userMessages: Message[] = [];
  const aiMessages: Message[] = [];

  // Try to find user messages
  for (const selector of commonUserSelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 0) {
        userMessages.push({
          sender: 'user',
          text: text
        });
      }
    });
    if (userMessages.length > 0) break;
  }

  // Try to find AI messages
  for (const selector of commonAISelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 0) {
        aiMessages.push({
          sender: 'ai',
          text: text
        });
      }
    });
    if (aiMessages.length > 0) break;
  }

  // If specific selectors don't work, try to find patterns
  if (userMessages.length === 0 && aiMessages.length === 0) {
    // Look for alternating content patterns
    const allTextElements = Array.from(document.querySelectorAll('div, p, span'))
      .filter(el => {
        const text = el.textContent?.trim();
        return text && text.length > 50; // Reasonable message length
      })
      .slice(0, 20); // Limit to avoid performance issues

    // Simple heuristic: assume alternating pattern
    allTextElements.forEach((el, index) => {
      const text = el.textContent?.trim();
      if (text) {
        if (index % 2 === 0) {
          userMessages.push({ sender: 'user', text });
        } else {
          aiMessages.push({ sender: 'ai', text });
        }
      }
    });
  }

  // Merge messages
  const mergedMessages: Message[] = [];
  const maxLength = Math.max(userMessages.length, aiMessages.length);

  for (let i = 0; i < maxLength; i++) {
    if (userMessages[i]) mergedMessages.push(userMessages[i]);
    if (aiMessages[i]) mergedMessages.push(aiMessages[i]);
  }

  return {
    userMessages,
    aiMessages,
    mergedMessages,
    url: window.location.href,
    title: document.title,
  };
};

/**
 * Generic scraper that attempts to find conversation patterns on any page
 */
export const scrapeGenericConversation = async (): Promise<ConversationData> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeGenericConversationFromDOM,
    });

    return result[0].result as ConversationData;
  } catch (error) {
    console.error('Error scraping generic conversation:', error);
    throw new Error('Failed to scrape conversation data.');
  }
};

/**
 * Auto-detects the chat platform and uses appropriate scraping method
 */
export const autoScrapeConversation = async (): Promise<ConversationData> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url) {
      throw new Error('No tab URL found');
    }

    // Detect platform based on URL
    if (tab.url.includes('claude.ai') || tab.url.includes('anthropic')) {
      return await scrapeConversation();
    } else if (tab.url.includes('chatgpt') || tab.url.includes('openai')) {
      // Could add ChatGPT-specific selectors here
      return await scrapeGenericConversation();
    } else {
      // Fallback to generic scraper
      return await scrapeGenericConversation();
    }
  } catch (error) {
    console.error('Error auto-scraping conversation:', error);
    throw new Error('Failed to auto-scrape conversation data.');
  }
};

/**
 * Prints the entire body element's outerHTML from the content page
 */
export const printBodyOuterHTML = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chrome = (window as any).chrome;
    console.log('🔍 Starting printBodyOuterHTML');
    console.log('Chrome object:', chrome);
    
    if (!chrome?.runtime) {
      console.error('❌ chrome.runtime not available');
      reject(new Error('chrome.runtime not available'));
      return;
    }
    
    console.log('📤 Sending message to background script: getBodyHTML');
    chrome.runtime.sendMessage({ action: 'getBodyHTML' }, (response: any) => {
      console.log('📥 Received response from background script:', response);
      console.log('Runtime error:', chrome.runtime.lastError);
      
      if (chrome.runtime.lastError) {
        console.error('❌ Runtime error:', chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.html) {
        console.log('✅ Success! Got HTML with length:', response.html.length);
        console.group('🌐 Content Page Body HTML');
        console.log(response.html);
        console.groupEnd();
        resolve(response.html);
      } else if (response && response.error) {
        console.error('❌ Error from background/content script:', response.error);
        reject(new Error(response.error));
      } else {
        console.error('❌ No response or no HTML from background/content script');
        reject(new Error('No response or no HTML from background/content script'));
      }
    });
  });
};

// For debugging, export this as the main function
export const logConversationToConsole = printBodyOuterHTML; 