import React, { useState } from 'react';
import { Eye, Download, Copy, Code, Layout, FileText } from 'lucide-react';
import { 
  captureUIContent, 
  captureTextContent, 
  captureElementsBySelector, 
  captureFormData,
  capturePageStructure,
  type UIContent 
} from '../utils/uiContentReader';

const UIContentExample: React.FC = () => {
  const [content, setContent] = useState<UIContent | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [customSelector, setCustomSelector] = useState<string>('button');
  const [customElements, setCustomElements] = useState<any[]>([]);
  const [loading, setLoading] = useState<string>('');

  const handleCaptureFullContent = async () => {
    setLoading('full');
    try {
      const uiContent = await captureUIContent();
      setContent(uiContent);
      console.log('Full UI Content:', uiContent);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading('');
    }
  };

  const handleCaptureText = async () => {
    setLoading('text');
    try {
      const text = await captureTextContent();
      setTextContent(text);
      console.log('Text Content:', text);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading('');
    }
  };

  const handleCaptureCustomElements = async () => {
    setLoading('custom');
    try {
      const elements = await captureElementsBySelector(customSelector);
      setCustomElements(elements);
      console.log('Custom Elements:', elements);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading('');
    }
  };

  const handleCaptureForms = async () => {
    setLoading('forms');
    try {
      const forms = await captureFormData();
      console.log('Form Data:', forms);
      alert(`Found ${forms.length} forms. Check console for details.`);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading('');
    }
  };

  const handleCaptureStructure = async () => {
    setLoading('structure');
    try {
      const structure = await capturePageStructure();
      console.log('Page Structure:', structure);
      alert(`Page: ${structure.title} with ${structure.headings.length} headings. Check console for details.`);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadAsJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">UI Content Reader Examples</h2>
        <p className="text-gray-600 mb-6">
          Demonstrate different ways to read content from web pages using Chrome extension APIs.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={handleCaptureFullContent}
          disabled={loading === 'full'}
          className="flex items-center gap-2 p-4 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50"
        >
          <Layout className="w-5 h-5" />
          {loading === 'full' ? 'Capturing...' : 'Capture Full UI'}
        </button>

        <button
          onClick={handleCaptureText}
          disabled={loading === 'text'}
          className="flex items-center gap-2 p-4 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50"
        >
          <FileText className="w-5 h-5" />
          {loading === 'text' ? 'Capturing...' : 'Capture Text Only'}
        </button>

        <button
          onClick={handleCaptureForms}
          disabled={loading === 'forms'}
          className="flex items-center gap-2 p-4 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 disabled:opacity-50"
        >
          <Code className="w-5 h-5" />
          {loading === 'forms' ? 'Capturing...' : 'Capture Forms'}
        </button>

        <button
          onClick={handleCaptureStructure}
          disabled={loading === 'structure'}
          className="flex items-center gap-2 p-4 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 disabled:opacity-50"
        >
          <Eye className="w-5 h-5" />
          {loading === 'structure' ? 'Capturing...' : 'Capture Structure'}
        </button>

        <div className="flex gap-2">
          <input
            type="text"
            value={customSelector}
            onChange={(e) => setCustomSelector(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            placeholder="CSS selector (e.g., button, .class, #id)"
          />
          <button
            onClick={handleCaptureCustomElements}
            disabled={loading === 'custom'}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            {loading === 'custom' ? '...' : 'Find'}
          </button>
        </div>
      </div>

      {/* Results */}
      {content && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Full UI Content</h3>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(content, null, 2))}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={() => downloadAsJson(content, 'ui-content')}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
          
          <div className="space-y-4 text-sm">
            <div>
              <strong>URL:</strong> {content.url}
            </div>
            <div>
              <strong>Title:</strong> {content.title}
            </div>
            <div>
              <strong>Forms:</strong> {content.forms.length} found
            </div>
            <div>
              <strong>Headings:</strong> {content.headings.length} found
            </div>
            <div>
              <strong>Buttons:</strong> {content.buttons.length} found
            </div>
            <div>
              <strong>Links:</strong> {content.links.length} found
            </div>
            <div>
              <strong>Images:</strong> {content.images.length} found
            </div>
            <div>
              <strong>Tables:</strong> {content.tables.length} found
            </div>
            <div>
              <strong>Lists:</strong> {content.lists.length} found
            </div>
            
            {content.headings.length > 0 && (
              <div>
                <strong>Heading Structure:</strong>
                <ul className="mt-2 space-y-1">
                  {content.headings.map((heading, index) => (
                    <li key={index} className="ml-4">
                      <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                        {heading.level}
                      </span>
                      {' '}{heading.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {textContent && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Text Content</h3>
            <button
              onClick={() => copyToClipboard(textContent)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap">{textContent.substring(0, 2000)}...</pre>
          </div>
        </div>
      )}

      {customElements.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Custom Elements ({customSelector})</h3>
            <button
              onClick={() => copyToClipboard(JSON.stringify(customElements, null, 2))}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
          <div className="space-y-2">
            {customElements.map((element, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <div className="font-semibold">{element.tagName}</div>
                <div className="text-sm text-gray-600">{element.text}</div>
                {Object.keys(element.attributes).length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Attributes: {JSON.stringify(element.attributes)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UIContentExample; 