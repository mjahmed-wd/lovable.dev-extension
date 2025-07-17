import React, { useState } from 'react';
import { FileText, Download, RefreshCw, Sparkles, Eye, Settings, Copy, Check, Search, ChevronDown, Code, Globe, Navigation, Heading, Trash2 } from 'lucide-react';
import { useDocumentStore, type DocumentType, type GeneratedDocument, type ConversationData } from '../stores/documentStore';
import { apiClient } from '../services/api';
import { scrapeConversation, ConversationData as ScrapedConversationData } from '../utils/promptResponseScraper';
import IframeContentReader from '../utils/iframeContentReader';

import { saveAs } from 'file-saver';

// Chrome extension API declarations
declare global {
  interface Window {
    chrome: {
      tabs: {
        query: (queryInfo: any) => Promise<any[]>;
      };
      scripting: {
        executeScript: (injection: any) => Promise<any[]>;
      };
    };
  }
}

const chrome = (window as any).chrome;

interface PageContent {
  url: string;
  title: string;
  bodyText: string;
  forms: Array<{
    formElements: Array<{
      type: string;
      name: string;
      placeholder: string;
      label: string;
    }>;
  }>;
  navigation: string[];
  headings: Array<{
    level: string;
    text: string;
  }>;
}

const DocumentGeneration: React.FC = () => {
  const {
    documents,
    addDocument,
    deleteDocument,
    updateDocument,
  } = useDocumentStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('requirements');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [capturedContent, setCapturedContent] = useState<PageContent | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const documentTypes = {
    requirements: { name: 'Requirements', description: 'Generate project requirements document' },
    specs: { name: 'Specs', description: 'Generate technical specifications' },
    guides: { name: 'Guides', description: 'Generate user documentation' },
    api: { name: 'API', description: 'Generate API documentation' },
    faq: { name: 'FAQ', description: 'Generate frequently asked questions' },
  };

  const filteredDocuments = documents.filter(doc => {
    const searchMatch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === 'all' || doc.type === filterType;
    return searchMatch && typeMatch;
  });



  const capturePageContent = async (): Promise<PageContent> => {
    try {
      setIsCapturing(true);
      setErrorMessage(null);
      
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Execute script to get visible content
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Get visible text content
          const bodyText = document.body.innerText || '';
          
          // Get form elements and their labels
          const forms = Array.from(document.forms);
          const formData = forms.map(form => {
            const formElements = Array.from(form.elements).map(element => {
              const input = element as HTMLInputElement;
              return {
                type: input.type || 'unknown',
                name: input.name || '',
                placeholder: input.placeholder || '',
                label: (input.labels?.[0]?.textContent || '').trim(),
              };
            });
            return { formElements };
          });

          // Get navigation structure
          const navElements = Array.from(document.querySelectorAll('nav, .nav, [role="navigation"]'));
          const navigation = navElements.map(nav => nav.textContent?.trim() || '').filter(text => text);

          // Get headings structure
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
          const headingStructure = headings.map(h => ({
            level: h.tagName.toLowerCase(),
            text: h.textContent?.trim() || '',
          })).filter(h => h.text);

          return {
            url: window.location.href,
            title: document.title,
            bodyText: bodyText.substring(0, 5000), // Limit text length
            forms: formData,
            navigation,
            headings: headingStructure,
          };
        },
      });

      const pageContent = result[0].result as PageContent;
      setCapturedContent(pageContent);
      return pageContent;
    } catch (error) {
      console.error('Error capturing page content:', error);
      let errorMsg = 'Failed to capture page content.';
      
      if (error instanceof Error && error.message.includes('Cannot access contents')) {
        errorMsg = 'Permission denied. Please reload this extension and try again. The extension needs to be reloaded after adding new permissions.';
      } else if (error instanceof Error && error.message.includes('No active tab')) {
        errorMsg = 'No active tab found. Please make sure you have a web page open.';
      }
      
      setErrorMessage(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsCapturing(false);
    }
  };

  const generateDocumentation = async () => {
    setIsGenerating(true);
    
    try {
      // Attempt to capture conversation data silently
      let conversationData: ConversationData | null = null;
      try {
        const scrapedConversation = await scrapeConversation();
        
        // Convert to store format
        conversationData = {
          userMessages: scrapedConversation.userMessages.map(msg => ({
            sender: 'user' as const,
            text: msg.text,
            timestamp: msg.timestamp
          })),
          aiMessages: scrapedConversation.aiMessages.map(msg => ({
            sender: 'ai' as const,
            text: msg.text,
            timestamp: msg.timestamp
          })),
          mergedMessages: scrapedConversation.mergedMessages.map(msg => ({
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp
          })),
          url: scrapedConversation.url,
          title: scrapedConversation.title
        };

        // Show alert if no conversation data found
        if (!conversationData.mergedMessages || conversationData.mergedMessages.length === 0) {
          alert('No conversation data found on this page. The document will be generated using only the page content.');
          conversationData = null;
        }
      } catch (error) {
        console.log('No conversation data available:', error);
        alert('No conversation data found on this page. The document will be generated using only the page content.');
      }

      // Capture current page content
      let pageContent: PageContent;
      let htmlContent: string;
      
      try {
        pageContent = await capturePageContent();
        htmlContent = JSON.stringify(pageContent, null, 2);
      } catch (error) {
        // Fallback: try to get iframe content if page capture fails
        try {
          htmlContent = await IframeContentReader.getIframeHTML();
          const iframeInfo = IframeContentReader.getIframeInfo();
          pageContent = {
            url: iframeInfo?.url || window.location.href,
            title: iframeInfo?.projectId || 'Lovable Project',
            bodyText: htmlContent.substring(0, 5000),
            forms: [],
            navigation: [],
            headings: []
          };
        } catch (iframeError) {
          throw new Error('Failed to capture both page content and iframe content. Please ensure you\'re on a valid web page.');
        }
      }

      // Use the API wrapper to generate the document
      const generatedDocument = await apiClient.generateAIDocument(
        htmlContent,
        conversationData || undefined,
        selectedType,
        generationPrompt || undefined,
        'Web application documentation',
        pageContent.url
      );

      // Add the generated document with enhanced data
      addDocument({
        title: generatedDocument.title || `${documentTypes[selectedType].name} - ${pageContent.title || 'Untitled'}`,
        content: generatedDocument.content,
        type: selectedType,
        url: pageContent.url,
        conversationData: conversationData || undefined,
        htmlContent,
        projectContext: 'Web application documentation',
        createdAt: new Date(),
        documentId: generatedDocument.documentId, // Store backend document ID for DOCX generation
      });

      setGenerationPrompt('');
      
    } catch (error) {
      console.error('Error generating documentation:', error);
      alert(`Error generating documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDefaultPrompt = (type: DocumentType): string => {
    const prompts = {
      requirements: 'Generate comprehensive project requirements based on this web application',
      specs: 'Generate detailed technical specifications for this web application',
      guides: 'Generate user-friendly documentation and guides for this web application',
      api: 'Generate API documentation based on the forms and functionality of this web application',
      faq: 'Generate frequently asked questions and answers based on this web application',
    };
    return prompts[type];
  };

  const copyToClipboard = async (content: string, docId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(docId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };



  const generateDocxFile = async (doc: GeneratedDocument) => {
    try {
      setIsGeneratingDocx(true);
      
      if (!doc.documentId) {
        alert('Document ID not found. Please regenerate the document.');
        return;
      }

      // Download DOCX from backend
      const blob = await apiClient.downloadDocx(doc.documentId);
      
      // Save the file
      saveAs(blob, `${doc.title}.docx`);
      
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Failed to generate DOCX file. Please try again.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Documentation</h1>
        </div>

        {/* Generation Controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <span>{documentTypes[selectedType].name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showTypeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  {Object.entries(documentTypes).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedType(key as DocumentType);
                        setShowTypeDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg text-sm"
                    >
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={generateDocumentation}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isGenerating ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>

          <textarea
            value={generationPrompt}
            onChange={(e) => setGenerationPrompt(e.target.value)}
            placeholder={`Custom prompt for ${documentTypes[selectedType].name.toLowerCase()} generation...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={2}
          />

        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as DocumentType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Types</option>
            {Object.entries(documentTypes).map(([key, type]) => (
              <option key={key} value={key}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-500 mb-4">Generate your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{doc.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          doc.type === 'requirements' ? 'bg-blue-100 text-blue-700' :
                          doc.type === 'specs' ? 'bg-purple-100 text-purple-700' :
                          doc.type === 'guides' ? 'bg-green-100 text-green-700' :
                          doc.type === 'api' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {documentTypes[doc.type].name}
                        </span>
                                                 <span>{new Date(doc.createdAt).toLocaleDateString()}</span>

                         {doc.url && (
                           <a
                             href={doc.url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                           >
                             <Globe className="w-3 h-3" />
                             Source
                           </a>
                         )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-3">
                      <button
                        onClick={() => copyToClipboard(doc.content, doc.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      >
                        {copiedId === doc.id ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => generateDocxFile(doc)}
                        disabled={isGeneratingDocx}
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
                        title={isGeneratingDocx ? "Generating DOCX..." : "Download as DOCX"}
                      >
                        {isGeneratingDocx ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 max-h-20 overflow-y-auto">
                    {doc.content.substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



    </div>
  );
};

export default DocumentGeneration; 