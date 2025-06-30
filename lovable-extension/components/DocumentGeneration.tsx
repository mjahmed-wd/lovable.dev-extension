import React, { useState } from 'react';
import { FileText, Download, RefreshCw, Sparkles, Eye, Settings, Copy, Check, Search, ChevronDown } from 'lucide-react';
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

  const capturePageContent = async (): Promise<string> => {
    try {
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
          const navigation = navElements.map(nav => nav.textContent?.trim() || '');

          // Get headings structure
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
          const headingStructure = headings.map(h => ({
            level: h.tagName.toLowerCase(),
            text: h.textContent?.trim() || '',
          }));

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

      return JSON.stringify(result[0].result, null, 2);
    } catch (error) {
      console.error('Error capturing page content:', error);
      throw new Error('Failed to capture page content. Please ensure you have the necessary permissions.');
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
${pageContent}

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

      // Create new document using store
      addDocument({
        title: `${documentTypes[selectedType].name} - ${new Date().toLocaleDateString()}`,
        content: generatedContent,
        type: selectedType,
        createdAt: new Date(),
        url: (JSON.parse(pageContent) as any).url,
      });
      
    } catch (error) {
      console.error('Error generating documentation:', error);
      alert(`Error generating documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDefaultPrompt = (type: DocumentType): string => {
    const prompts = {
      requirements: 'Generate comprehensive project requirements based on the UI elements and functionality visible on this page. Include functional requirements, non-functional requirements, and user stories.',
      specs: 'Generate detailed technical specifications based on the interface and functionality shown. Include system architecture, data models, API specifications, and technical constraints.',
      guides: 'Generate user-friendly documentation and guides based on the interface elements. Include step-by-step instructions, feature explanations, and troubleshooting tips.',
      api: 'Generate API documentation based on the forms, data, and functionality visible. Include endpoint descriptions, request/response formats, and usage examples.',
      faq: 'Generate frequently asked questions based on the features and functionality visible. Include common use cases, troubleshooting, and feature explanations.',
    };
    return prompts[type];
  };

  const copyToClipboard = async (content: string, docId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(docId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Documentation</h1>
          <button 
            onClick={generateDocumentation}
            disabled={isGenerating || !apiKey}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'AI Generate'}
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500"
              placeholder="Search documentation..."
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center justify-between w-32 px-3 py-2 bg-gray-100 border-0 rounded-lg text-gray-900"
            >
              <span>{filterType === 'all' ? 'All Types' : documentTypes[filterType as DocumentType]?.name}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showTypeDropdown && (
              <div className="absolute top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 first:rounded-t-lg ${
                    filterType === 'all' ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>All Types</span>
                    {filterType === 'all' && <Check className="w-4 h-4" />}
                  </div>
                </button>
                {Object.entries(documentTypes).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterType(key as DocumentType);
                      setShowTypeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 last:rounded-b-lg ${
                      filterType === key ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{type.name}</span>
                      {filterType === key && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documentation yet</h3>
            <p className="text-gray-500">Generate your first document</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {documentTypes[doc.type].name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {doc.content.substring(0, 150)}...
                    </p>
                    <div className="text-xs text-gray-500">
                      Created {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => copyToClipboard(doc.content, doc.id)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Copy to clipboard"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="p-2 text-gray-400 hover:text-green-600"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your Gemini API key"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGeneration; 