// Chrome extension API types
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

export interface UIContent {
  url: string;
  title: string;
  bodyText: string;
  forms: FormData[];
  navigation: string[];
  headings: HeadingData[];
  buttons: ButtonData[];
  links: LinkData[];
  images: ImageData[];
  tables: TableData[];
  lists: ListData[];
  inputs: InputData[];
  metadata: MetaData;
}

export interface FormData {
  id?: string;
  action?: string;
  method?: string;
  elements: FormElementData[];
}

export interface FormElementData {
  type: string;
  name: string;
  placeholder: string;
  label: string;
  value?: string;
  required?: boolean;
}

export interface HeadingData {
  level: string;
  text: string;
  id?: string;
}

export interface ButtonData {
  text: string;
  type?: string;
  className?: string;
  id?: string;
}

export interface LinkData {
  text: string;
  href: string;
  title?: string;
}

export interface ImageData {
  src: string;
  alt: string;
  title?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface ListData {
  type: 'ul' | 'ol';
  items: string[];
}

export interface InputData {
  type: string;
  name: string;
  placeholder: string;
  value: string;
  label: string;
}

export interface MetaData {
  description?: string;
  keywords?: string;
  author?: string;
  viewport?: string;
  language?: string;
}

export interface ElementData {
  tagName: string;
  text: string;
  innerHTML: string;
  outerHTML: string;
  attributes: Record<string, string>;
  xpath: string;
  cssSelector: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Captures comprehensive UI content from the active tab
 */
export const captureUIContent = async (): Promise<UIContent> => {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    // Execute script to get comprehensive UI content
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Helper function to get element text safely
        const getElementText = (element: Element): string => {
          return element.textContent?.trim() || '';
        };

        // Helper function to get element attribute safely
        const getElementAttr = (element: Element, attr: string): string => {
          return element.getAttribute(attr)?.trim() || '';
        };

        // Get basic page info
        const url = window.location.href;
        const title = document.title;
        const bodyText = document.body.innerText || '';

        // Get form elements and their details
        const forms = Array.from(document.forms).map(form => {
          const elements = Array.from(form.elements).map(element => {
            const input = element as HTMLInputElement;
            const label = input.labels?.[0]?.textContent?.trim() || '';
            
            return {
              type: input.type || 'unknown',
              name: input.name || '',
              placeholder: input.placeholder || '',
              label,
              value: input.value || '',
              required: input.required || false,
            };
          });

          return {
            id: form.id || undefined,
            action: form.action || undefined,
            method: form.method || undefined,
            elements,
          };
        });

        // Get navigation elements
        const navElements = Array.from(document.querySelectorAll('nav, .nav, [role="navigation"]'));
        const navigation = navElements.map(nav => getElementText(nav));

        // Get headings structure
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          level: h.tagName.toLowerCase(),
          text: getElementText(h),
          id: h.id || undefined,
        }));

        // Get buttons
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).map(btn => ({
          text: getElementText(btn) || getElementAttr(btn, 'value'),
          type: getElementAttr(btn, 'type'),
          className: getElementAttr(btn, 'class'),
          id: getElementAttr(btn, 'id'),
        }));

        // Get links
        const links = Array.from(document.querySelectorAll('a[href]')).map(link => ({
          text: getElementText(link),
          href: getElementAttr(link, 'href'),
          title: getElementAttr(link, 'title'),
        }));

        // Get images
        const images = Array.from(document.querySelectorAll('img')).map(img => ({
          src: getElementAttr(img, 'src'),
          alt: getElementAttr(img, 'alt'),
          title: getElementAttr(img, 'title'),
        }));

        // Get tables
        const tables = Array.from(document.querySelectorAll('table')).map(table => {
          const headers = Array.from(table.querySelectorAll('th')).map(th => getElementText(th));
          const rows = Array.from(table.querySelectorAll('tr')).map(tr => 
            Array.from(tr.querySelectorAll('td')).map(td => getElementText(td))
          ).filter(row => row.length > 0);
          const caption = table.querySelector('caption');

          return {
            headers,
            rows,
            caption: caption ? getElementText(caption) : undefined,
          };
        });

        // Get lists
        const lists = Array.from(document.querySelectorAll('ul, ol')).map(list => ({
          type: list.tagName.toLowerCase() as 'ul' | 'ol',
          items: Array.from(list.querySelectorAll('li')).map(li => getElementText(li)),
        }));

        // Get all input fields (not in forms)
        const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(input => {
          const inputEl = input as HTMLInputElement;
          const label = inputEl.labels?.[0]?.textContent?.trim() || '';
          
          return {
            type: inputEl.type || inputEl.tagName.toLowerCase(),
            name: inputEl.name || '',
            placeholder: inputEl.placeholder || '',
            value: inputEl.value || '',
            label,
          };
        });

        // Get metadata
        const getMetaContent = (name: string): string => {
          const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
          return meta ? getElementAttr(meta, 'content') : '';
        };

        const metadata = {
          description: getMetaContent('description'),
          keywords: getMetaContent('keywords'),
          author: getMetaContent('author'),
          viewport: getMetaContent('viewport'),
          language: document.documentElement.lang || getMetaContent('language'),
        };

        return {
          url,
          title,
          bodyText: bodyText.substring(0, 10000), // Limit text length
          forms,
          navigation,
          headings,
          buttons,
          links,
          images,
          tables,
          lists,
          inputs,
          metadata,
        };
      },
    });

    return result[0].result as UIContent;
  } catch (error) {
    console.error('Error capturing UI content:', error);
    throw new Error('Failed to capture UI content. Please ensure you have the necessary permissions.');
  }
};

/**
 * Captures only text content from the active tab (lightweight version)
 */
export const captureTextContent = async (): Promise<string> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return document.body.innerText || '';
      },
    });

    return result[0].result as string;
  } catch (error) {
    console.error('Error capturing text content:', error);
    throw new Error('Failed to capture text content.');
  }
};

/**
 * Captures specific elements by CSS selector
 */
export const captureElementsBySelector = async (selector: string): Promise<ElementData[]> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (sel: string) => {
        // Helper function to generate XPath for an element
        const getElementXPath = (element: Element): string => {
          if (element.id) {
            return `//*[@id="${element.id}"]`;
          }
          
          const parts: string[] = [];
          let current = element;
          
          while (current && current.nodeType === Node.ELEMENT_NODE) {
            let index = 1;
            let sibling = current.previousElementSibling;
            
            while (sibling) {
              if (sibling.tagName === current.tagName) {
                index++;
              }
              sibling = sibling.previousElementSibling;
            }
            
            const tagName = current.tagName.toLowerCase();
            const part = index > 1 ? `${tagName}[${index}]` : tagName;
            parts.unshift(part);
            
            const parent = current.parentElement;
            if (!parent || parent === document.documentElement) break;
            current = parent;
          }
          
          return '/' + parts.join('/');
        };

        // Helper function to generate CSS selector for an element
        const getElementCSSSelector = (element: Element): string => {
          if (element.id) {
            return `#${element.id}`;
          }
          
          const parts: string[] = [];
          let current = element;
          
          while (current && current !== document.documentElement) {
            let selector = current.tagName.toLowerCase();
            
            if (current.className) {
              const classes = current.className.trim().split(/\s+/);
              if (classes.length > 0 && classes[0]) {
                selector += '.' + classes.join('.');
              }
            }
            
            parts.unshift(selector);
            current = current.parentElement;
            if (!current) break;
          }
          
          return parts.join(' > ');
        };

        const elements = Array.from(document.querySelectorAll(sel));
        return elements.map(el => {
          const rect = el.getBoundingClientRect();
          
          return {
            tagName: el.tagName.toLowerCase(),
            text: el.textContent?.trim() || '',
            innerHTML: el.innerHTML,
            outerHTML: el.outerHTML,
            attributes: Array.from(el.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {} as Record<string, string>),
            xpath: getElementXPath(el),
            cssSelector: getElementCSSSelector(el),
            position: {
              x: rect.left + window.scrollX,
              y: rect.top + window.scrollY,
              width: rect.width,
              height: rect.height,
            },
          };
        });
      },
      args: [selector],
    });

    return result[0].result as ElementData[];
  } catch (error) {
    console.error('Error capturing elements:', error);
    throw new Error(`Failed to capture elements with selector: ${selector}`);
  }
};

/**
 * Captures specific elements by XPath expression
 */
export const captureElementsByXPath = async (xpath: string): Promise<ElementData[]> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (xpathExpression: string) => {
        // Helper function to generate XPath for an element
        const getElementXPath = (element: Element): string => {
          if (element.id) {
            return `//*[@id="${element.id}"]`;
          }
          
          const parts: string[] = [];
          let current = element;
          
          while (current && current.nodeType === Node.ELEMENT_NODE) {
            let index = 1;
            let sibling = current.previousElementSibling;
            
            while (sibling) {
              if (sibling.tagName === current.tagName) {
                index++;
              }
              sibling = sibling.previousElementSibling;
            }
            
            const tagName = current.tagName.toLowerCase();
            const part = index > 1 ? `${tagName}[${index}]` : tagName;
            parts.unshift(part);
            
            current = current.parentElement;
            if (!current || current === document.documentElement) break;
          }
          
          return '/' + parts.join('/');
        };

        // Helper function to generate CSS selector for an element
        const getElementCSSSelector = (element: Element): string => {
          if (element.id) {
            return `#${element.id}`;
          }
          
          const parts: string[] = [];
          let current = element;
          
          while (current && current !== document.documentElement) {
            let selector = current.tagName.toLowerCase();
            
            if (current.className) {
              const classes = current.className.trim().split(/\s+/);
              if (classes.length > 0 && classes[0]) {
                selector += '.' + classes.join('.');
              }
            }
            
            parts.unshift(selector);
            current = current.parentElement;
            if (!current) break;
          }
          
          return parts.join(' > ');
        };

        try {
          const result = document.evaluate(
            xpathExpression,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );
          
          const elements: ElementData[] = [];
          
          for (let i = 0; i < result.snapshotLength; i++) {
            const element = result.snapshotItem(i) as Element;
            if (element) {
              const rect = element.getBoundingClientRect();
              
              elements.push({
                tagName: element.tagName.toLowerCase(),
                text: element.textContent?.trim() || '',
                innerHTML: element.innerHTML,
                outerHTML: element.outerHTML,
                attributes: Array.from(element.attributes).reduce((acc, attr) => {
                  acc[attr.name] = attr.value;
                  return acc;
                }, {} as Record<string, string>),
                xpath: getElementXPath(element),
                cssSelector: getElementCSSSelector(element),
                position: {
                  x: rect.left + window.scrollX,
                  y: rect.top + window.scrollY,
                  width: rect.width,
                  height: rect.height,
                },
              });
            }
          }
          
          return elements;
        } catch (error) {
          throw new Error(`Invalid XPath expression: ${error.message}`);
        }
      },
      args: [xpath],
    });

    return result[0].result as ElementData[];
  } catch (error) {
    console.error('Error capturing elements by XPath:', error);
    throw new Error(`Failed to capture elements with XPath: ${xpath}. ${error.message}`);
  }
};

/**
 * Validates XPath expression without executing it
 */
export const validateXPath = async (xpath: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (xpathExpression: string) => {
        try {
          document.evaluate(
            xpathExpression,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );
          return { valid: true };
        } catch (error) {
          return { valid: false, error: error.message };
        }
      },
      args: [xpath],
    });

    return result[0].result as { valid: boolean; error?: string };
  } catch (error) {
    return { valid: false, error: 'Failed to validate XPath expression' };
  }
};

/**
 * Highlights elements on the page (useful for testing)
 */
export const highlightElements = async (xpath: string, highlightColor: string = '#ff0000'): Promise<number> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (xpathExpression: string, color: string) => {
        // Remove existing highlights
        const existingHighlights = document.querySelectorAll('.xpath-highlight');
        existingHighlights.forEach(el => {
          el.classList.remove('xpath-highlight');
          (el as HTMLElement).style.outline = '';
          (el as HTMLElement).style.outlineOffset = '';
        });

        try {
          const result = document.evaluate(
            xpathExpression,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );
          
          let count = 0;
          for (let i = 0; i < result.snapshotLength; i++) {
            const element = result.snapshotItem(i) as HTMLElement;
            if (element) {
              element.classList.add('xpath-highlight');
              element.style.outline = `3px solid ${color}`;
              element.style.outlineOffset = '2px';
              count++;
            }
          }
          
          return count;
        } catch (error) {
          throw new Error(`Invalid XPath expression: ${error.message}`);
        }
      },
      args: [xpath, highlightColor],
    });

    return result[0].result as number;
  } catch (error) {
    console.error('Error highlighting elements:', error);
    throw new Error(`Failed to highlight elements with XPath: ${xpath}`);
  }
};

/**
 * Removes highlights from the page
 */
export const removeHighlights = async (): Promise<void> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const highlightedElements = document.querySelectorAll('.xpath-highlight');
        highlightedElements.forEach(el => {
          el.classList.remove('xpath-highlight');
          (el as HTMLElement).style.outline = '';
          (el as HTMLElement).style.outlineOffset = '';
        });
      },
    });
  } catch (error) {
    console.error('Error removing highlights:', error);
  }
};

/**
 * Captures form data specifically
 */
export const captureFormData = async (): Promise<FormData[]> => {
  try {
    const content = await captureUIContent();
    return content.forms;
  } catch (error) {
    console.error('Error capturing form data:', error);
    throw new Error('Failed to capture form data.');
  }
};

/**
 * Captures page structure (headings, navigation, etc.)
 */
export const capturePageStructure = async () => {
  try {
    const content = await captureUIContent();
    return {
      title: content.title,
      headings: content.headings,
      navigation: content.navigation,
      metadata: content.metadata,
    };
  } catch (error) {
    console.error('Error capturing page structure:', error);
    throw new Error('Failed to capture page structure.');
  }
}; 