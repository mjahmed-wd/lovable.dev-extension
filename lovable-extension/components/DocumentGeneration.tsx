import React, { useState } from 'react';
import { FileText, Download, RefreshCw, Sparkles, Eye, Settings, Copy, Check } from 'lucide-react';

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

interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  createdAt: Date;
  url?: string;
}

type DocumentType = 'requirements' | 'specs' | 'guides' | 'api' | 'faq';

const DocumentGeneration: React.FC = () => {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('requirements');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generationPrompt, setGenerationPrompt] = useState('');

  const documentTypes = {
    requirements: { name: 'Requirements', description: 'Generate project requirements document' },
    specs: { name: 'Specifications', description: 'Generate technical specifications' },
    guides: { name: 'User Guides', description: 'Generate user documentation' },
    api: { name: 'API Documentation', description: 'Generate API documentation' },
    faq: { name: 'FAQ', description: 'Generate frequently asked questions' },
  };

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

      // Create new document
      const newDocument: GeneratedDocument = {
        id: Date.now().toString(),
        title: `${documentTypes[selectedType].name} - ${new Date().toLocaleDateString()}`,
        content: generatedContent,
        type: selectedType,
        createdAt: new Date(),
        url: (JSON.parse(pageContent) as any).url,
      };

      setDocuments([newDocument, ...documents]);
      
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
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteDocument = (docId: string) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Documentation</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={generateDocumentation}
              disabled={isGenerating || !apiKey}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-3">Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gemini API Key *
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from Google AI Studio
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generation Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(documentTypes).map(([key, type]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="radio"
                    name="documentType"
                    value={key}
                    checked={selectedType === key}
                    onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                    className="mr-2"
                  />
                  <div>
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Prompt (Optional)
            </label>
            <textarea
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder="Add custom instructions for the AI..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Generated Documents */}
      <div className="flex-1 overflow-y-auto p-4">
        {documents.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documentation yet</h3>
            <p className="text-gray-500 mb-4">
              Generate your first document by clicking the AI Generate button
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <div className="flex items-start gap-2">
                <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">How it works:</h4>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Reads visible content from the current tab</li>
                    <li>• Analyzes UI elements, forms, and structure</li>
                    <li>• Generates documentation using AI</li>
                    <li>• Creates various document types</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{doc.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                          {doc.type}
                        </span>
                        <span>{doc.createdAt.toLocaleDateString()}</span>
                        {doc.url && (
                          <span className="truncate max-w-[200px]" title={doc.url}>
                            {doc.url}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(doc.content, doc.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Copy to clipboard"
                      >
                        {copiedId === doc.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => downloadDocument(doc)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Download as Markdown"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Delete document"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded border overflow-auto max-h-64">
                      {doc.content}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentGeneration; 