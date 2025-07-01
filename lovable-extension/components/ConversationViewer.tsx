import React, { useState, useEffect } from 'react';
import { ConversationData, Message } from '../utils/promptResponseScraper';

// Chrome extension API types
declare const chrome: any;

interface ConversationViewerProps {
  className?: string;
}

export const ConversationViewer: React.FC<ConversationViewerProps> = ({ className = '' }) => {
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  // Toggle message expansion
  const toggleMessage = (index: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMessages(newExpanded);
  };

  // Test connection to content script
  const testConnection = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab');
      
      const response = await new Promise<any>((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response: any) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      console.log('🏓 Ping test result:', response);
      return response?.pong === true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  };

  // Function to request scraping from content script
  const handleScrapeConversation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      console.log('📡 Testing connection to content script on tab:', tab.url);
      
      // First test if content script is available
      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error('Content script not available on this page. Please reload the page or navigate to a supported website.');
      }
      
      console.log('✅ Content script connection confirmed, sending scraping request...');

      // Send message to content script with timeout
      const response = await new Promise<any>((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'startScraping' }, (response: any) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Content script not available: ${chrome.runtime.lastError.message}. Please reload the page.`));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response?.success) {
        setConversationData(response.data);
        console.log('✅ Conversation data loaded:', response.data);
      } else {
        throw new Error(response?.error || 'Failed to scrape conversation');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to scrape conversation';
      setError(errorMessage);
      console.error('❌ Scraping error:', error);
      
      // Additional helpful error context
      if (errorMessage.includes('Content script not available')) {
        setError(errorMessage + ' Make sure you\'re on a supported website and try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on component mount
  useEffect(() => {
    handleScrapeConversation();
  }, []);

  // Get preview text (first line or 100 characters)
  const getPreviewText = (text: string) => {
    if (!text) return 'No content';
    const firstLine = text.split('\n')[0];
    return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.sender === 'user';
    const isExpanded = expandedMessages.has(index);
    const previewText = getPreviewText(message.text);
    const hasMoreContent = message.text && (message.text.length > 100 || message.text.includes('\n'));

    return (
      <div
        key={index}
        className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`flex ${isUser ? 'max-w-[75%]' : 'max-w-[80%]'} ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-600 text-white'
            }`}>
              {isUser ? '👤' : '🤖'}
            </div>
          </div>

          {/* Message Bubble */}
          <div className={`relative ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
            {/* Sender Label */}
            <div className={`text-xs text-gray-500 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {isUser ? 'You' : 'Assistant'}
            </div>
            
                         {/* Message Content */}
             <div
               className={`relative rounded-2xl px-4 py-3 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md ${
                 isUser
                   ? 'bg-blue-500 text-white rounded-br-md'
                   : 'bg-gray-100 text-gray-800 rounded-bl-md border'
               }`}
               onClick={() => hasMoreContent && toggleMessage(index)}
             >
               {/* Message Text */}
               <div className={`text-sm leading-relaxed ${isExpanded ? 'max-h-64 overflow-y-auto' : ''}`}>
                 {isExpanded ? (
                   <div className="whitespace-pre-wrap break-words">{message.text || 'No content'}</div>
                 ) : (
                   <div className="break-words">{previewText}</div>
                 )}
               </div>

              {/* Expand/Collapse Indicator */}
              {hasMoreContent && (
                <div className={`mt-2 text-xs opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  <span className="flex items-center">
                    {isExpanded ? (
                      <>
                        <span>Show less</span>
                        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Show more</span>
                        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Message Tail */}
            <div className={`absolute bottom-0 ${
              isUser 
                ? 'right-0 transform translate-x-1' 
                : 'left-0 transform -translate-x-1'
            }`}>
              <div className={`w-3 h-3 transform rotate-45 ${
                isUser ? 'bg-blue-500' : 'bg-gray-100 border-b border-r'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">💬</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Conversation</h2>
          </div>
          <button
            onClick={handleScrapeConversation}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>

        {/* Page Info */}
        {conversationData && (
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">📍 Page:</span>
              <span className="truncate">{conversationData.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">📊 Messages:</span>
              <span>{conversationData.mergedMessages?.length || 0} total</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex-shrink-0 mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-red-500 text-sm">⚠️</span>
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {conversationData && (conversationData.mergedMessages?.length || 0) > 0 ? (
          <div className="p-4 space-y-1">
            {conversationData.mergedMessages?.map((message, index) => 
              renderMessage(message, index)
            )}
          </div>
        ) : !loading && !error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <div className="text-lg font-medium mb-2">No conversation found</div>
              <div className="text-sm">
                Try visiting a chat application like Claude.ai or ChatGPT
              </div>
              <button
                onClick={handleScrapeConversation}
                className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors duration-200"
              >
                Scan Page
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <svg className="animate-spin w-8 h-8 mx-auto mb-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="text-sm">Scanning for conversations...</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}; 