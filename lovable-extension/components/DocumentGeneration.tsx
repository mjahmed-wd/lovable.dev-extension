import React, { useState } from 'react';
import { FileText, Download, RefreshCw, Sparkles, Eye, Settings, Copy, Check, Search, ChevronDown, Code, Globe, Navigation, Heading, Trash2 } from 'lucide-react';
import { useDocumentStore, type DocumentType, type GeneratedDocument } from '../stores/documentStore';

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
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [capturedContent, setCapturedContent] = useState<PageContent | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
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
      setShowContent(true);
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
    if (!apiKey) {
      alert('Please set your Gemini API key in settings');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Capture current page content
      const pageContent = await capturePageContent();
      
      // Prepare the prompt based on document type and page content
      const basePrompt = generationPrompt || getDefaultPrompt(selectedType);
      const fullPrompt = `${basePrompt}

Please analyze the following web page content and generate ${documentTypes[selectedType].description.toLowerCase()}:

Page Content:
${JSON.stringify(pageContent, null, 2)}

Please provide a well-structured, comprehensive document based on the above content.`;

      // Call Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedContent) {
        throw new Error('No content generated from API');
      }

      // Add the generated document
      addDocument({
        title: `${documentTypes[selectedType].name} - ${pageContent.title || 'Untitled'}`,
        content: generatedContent,
        type: selectedType,
        url: pageContent.url,
        createdAt: new Date(),
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

  const downloadDocument = (doc: GeneratedDocument) => {
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Documentation</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        )}

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
              disabled={isGenerating || !apiKey}
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
                        onClick={() => downloadDocument(doc)}
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded transition-colors"
                      >
                        <Download className="w-3 h-3" />
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

      {/* Captured Content Modal */}
      {showContent && capturedContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Captured Page Content</h3>
              <button
                onClick={() => setShowContent(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">URL:</h4>
                <p className="text-gray-600 break-all">{capturedContent.url}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Title:</h4>
                <p className="text-gray-600">{capturedContent.title}</p>
              </div>
              
              {capturedContent.headings.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Headings:</h4>
                  <div className="text-gray-600 max-h-20 overflow-y-auto">
                    {capturedContent.headings.map((heading, index) => (
                      <div key={index} className="text-xs">
                        {heading.level}: {heading.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Content Preview:</h4>
                <div className="text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto text-xs">
                  {capturedContent.bodyText.substring(0, 500)}...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGeneration; 