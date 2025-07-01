import { useState } from 'react';
import { 
  captureElementsByXPath, 
  validateXPath, 
  highlightElements, 
  removeHighlights,
  ElementData 
} from '../utils/uiContentReader';

export const XPathTester = () => {
  const [xpath, setXpath] = useState('');
  const [results, setResults] = useState<ElementData[]>([]);
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'pending'>('pending');
  const [highlightCount, setHighlightCount] = useState(0);

  // Common XPath examples for quick testing
  const xpathExamples = [
    { label: 'All buttons', xpath: '//button' },
    { label: 'All links', xpath: '//a' },
    { label: 'All inputs', xpath: '//input' },
    { label: 'All headings', xpath: '//h1 | //h2 | //h3 | //h4 | //h5 | //h6' },
    { label: 'Elements with specific text', xpath: '//*[contains(text(), "Submit")]' },
    { label: 'Elements by class', xpath: '//*[@class="btn"]' },
    { label: 'Elements by ID', xpath: '//*[@id="main"]' },
    { label: 'Form elements', xpath: '//form//input | //form//textarea | //form//select' },
  ];

  const validateXPathExpression = async (xpathExpression: string) => {
    if (!xpathExpression.trim()) {
      setValidationStatus('pending');
      return;
    }

    try {
      const validation = await validateXPath(xpathExpression);
      setValidationStatus(validation.valid ? 'valid' : 'invalid');
      if (!validation.valid) {
        setError(validation.error || 'Invalid XPath expression');
      } else {
        setError('');
      }
    } catch (err) {
      setValidationStatus('invalid');
      setError('Failed to validate XPath expression');
    }
  };

  const handleXPathChange = (value: string) => {
    setXpath(value);
    validateXPathExpression(value);
  };

  const executeXPath = async () => {
    if (!xpath.trim()) {
      setError('Please enter an XPath expression');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);
    setSelectedElement(null);

    try {
      const elements = await captureElementsByXPath(xpath);
      setResults(elements);
      
      if (elements.length === 0) {
        setError('No elements found matching the XPath expression');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const highlightElement = async () => {
    if (!xpath.trim()) return;

    try {
      const count = await highlightElements(xpath, '#ff0000');
      setHighlightCount(count);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const clearHighlights = async () => {
    try {
      await removeHighlights();
      setHighlightCount(0);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const selectExample = (exampleXPath: string) => {
    setXpath(exampleXPath);
    validateXPathExpression(exampleXPath);
  };

  const selectElement = (element: ElementData) => {
    setSelectedElement(element);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">XPath Tester</h2>
        <div className="text-sm text-gray-500">
          Test XPath expressions on the current page
        </div>
      </div>

      {/* XPath Input */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">
            XPath Expression:
          </label>
          <div className="flex items-center space-x-1">
            {validationStatus === 'valid' && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            {validationStatus === 'invalid' && (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={xpath}
            onChange={(e) => handleXPathChange(e.target.value)}
            placeholder="Enter XPath expression (e.g., //button, //a[@href])"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={executeXPath}
          disabled={isLoading || validationStatus === 'invalid'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isLoading ? 'Executing...' : 'Execute XPath'}
        </button>
        
        <button
          onClick={highlightElement}
          disabled={!xpath.trim() || validationStatus === 'invalid'}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          Highlight ({highlightCount})
        </button>
        
        <button
          onClick={clearHighlights}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
        >
          Clear Highlights
        </button>
      </div>

      {/* XPath Examples */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Quick Examples:</h3>
        <div className="grid grid-cols-2 gap-2">
          {xpathExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => selectExample(example.xpath)}
              className="text-left p-2 text-xs border border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="font-medium text-gray-800">{example.label}</div>
              <div className="text-gray-500 font-mono truncate">{example.xpath}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Results ({results.length} elements found)
          </h3>
          
          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {results.map((element, index) => (
              <div
                key={index}
                onClick={() => selectElement(element)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedElement === element ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {element.tagName}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-xs">
                      {element.text || 'No text content'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {element.position.width}×{element.position.height}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Element Details */}
      {selectedElement && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Element Details</h3>
          
          <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Tag Name:</div>
                <div className="font-mono text-gray-900">{selectedElement.tagName}</div>
              </div>
              
              <div>
                <div className="font-medium text-gray-700">Position:</div>
                <div className="font-mono text-gray-900">
                  {selectedElement.position.x}, {selectedElement.position.y} 
                  ({selectedElement.position.width}×{selectedElement.position.height})
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium text-gray-700 mb-1">Text Content:</div>
              <div className="bg-white p-2 rounded border text-sm max-h-20 overflow-y-auto">
                {selectedElement.text || 'No text content'}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-gray-700">XPath:</div>
                <button
                  onClick={() => copyToClipboard(selectedElement.xpath)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Copy
                </button>
              </div>
              <div className="bg-white p-2 rounded border text-xs font-mono max-h-20 overflow-y-auto">
                {selectedElement.xpath}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-gray-700">CSS Selector:</div>
                <button
                  onClick={() => copyToClipboard(selectedElement.cssSelector)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Copy
                </button>
              </div>
              <div className="bg-white p-2 rounded border text-xs font-mono max-h-20 overflow-y-auto">
                {selectedElement.cssSelector}
              </div>
            </div>

            {Object.keys(selectedElement.attributes).length > 0 && (
              <div>
                <div className="font-medium text-gray-700 mb-1">Attributes:</div>
                <div className="bg-white p-2 rounded border text-xs max-h-32 overflow-y-auto">
                  {Object.entries(selectedElement.attributes).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-mono text-blue-600 min-w-0 flex-shrink-0">{key}:</span>
                      <span className="font-mono text-gray-900 ml-2 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 