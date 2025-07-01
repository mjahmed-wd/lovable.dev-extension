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

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'startScraping' });
      
      if (response?.success) {
        setConversationData(response.data);
        console.log('✅ Conversation data loaded:', response.data);
      } else {
        throw new Error(response?.error || 'Failed to scrape conversation');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to scrape conversation');
      console.error('❌ Scraping error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on component mount
  useEffect(() => {
    handleScrapeConversation();
  }, []);

  const renderMessage = (message: Message, index: number) => (
    <div
      key={index}
      className={`mb-4 p-3 rounded-lg ${
        message.sender === 'user'
          ? 'bg-blue-100 border-l-4 border-blue-500'
          : 'bg-gray-100 border-l-4 border-gray-500'
      }`}
    >
      <div className={`font-semibold text-sm mb-2 ${
        message.sender === 'user' ? 'text-blue-700' : 'text-gray-700'
      }`}>
        {message.sender === 'user' ? '👤 User' : '🤖 Assistant'}
      </div>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">
        {(message.text?.length || 0) > 500 
          ? `${message.text?.substring(0, 500)}...` 
          : (message.text || 'No content')
        }
      </div>
    </div>
  );

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          💬 Conversation Data
        </h2>
        <button
          onClick={handleScrapeConversation}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '🔄 Loading...' : '🔍 Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {conversationData && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <div className="font-medium">📍 URL:</div>
            <div className="break-all text-xs">{conversationData.url}</div>
          </div>

          <div className="text-sm text-gray-600">
            <div className="font-medium">📄 Title:</div>
            <div className="text-xs">{conversationData.title}</div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Messages ({conversationData.mergedMessages?.length || 0})
            </div>
            
            {(conversationData.mergedMessages?.length || 0) > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {conversationData.mergedMessages?.map((message, index) => 
                  renderMessage(message, index)
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🔍</div>
                <div className="text-sm">No conversation data found on this page</div>
                <div className="text-xs text-gray-400 mt-1">
                  Try visiting a chat application like Claude.ai or ChatGPT
                </div>
              </div>
            )}
          </div>

          {(conversationData.userMessages?.length || 0) > 0 && (
            <div className="border-t pt-4 text-xs text-gray-500">
              📊 Summary: {conversationData.userMessages?.length || 0} user messages, {conversationData.aiMessages?.length || 0} AI responses
            </div>
          )}
        </div>
      )}

      {!conversationData && !loading && !error && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">💬</div>
          <div className="text-sm">Click "Refresh" to scrape conversation data</div>
        </div>
      )}
    </div>
  );
}; 