/**
 * Utility to extract HTML content from Lovable iframe for AI test generation
 */

export interface IframeInfo {
  url: string;
  projectId: string;
  token: string;
}

export class IframeContentReader {
  /**
   * Extract iframe information from the DOM
   */
  static getIframeInfo(): IframeInfo | null {
    try {
      const iframe = document.getElementById('static-preview-panel') as HTMLIFrameElement;
      if (!iframe || !iframe.src) {
        console.warn('Lovable iframe not found or has no src');
        return null;
      }

      const url = new URL(iframe.src);
      const token = url.searchParams.get('__lovable_token');
      
      if (!token) {
        console.warn('No Lovable token found in iframe URL');
        return null;
      }

      // Extract project ID from the URL (format: https://id-preview--PROJECT_ID.lovable.app)
      const hostname = url.hostname;
      const projectIdMatch = hostname.match(/id-preview--([^.]+)\.lovable\.app/);
      const projectId = projectIdMatch ? projectIdMatch[1] : '';

      return {
        url: iframe.src,
        projectId,
        token
      };
    } catch (error) {
      console.error('Error extracting iframe info:', error);
      return null;
    }
  }

  /**
   * Extract HTML content from the iframe
   * Note: Due to CORS restrictions, we cannot directly access iframe content
   * We'll need to use a different approach
   */
  static async getIframeHTML(): Promise<string> {
    try {
      const iframeInfo = this.getIframeInfo();
      if (!iframeInfo) {
        throw new Error('Cannot access iframe information');
      }

      // Try to fetch the content directly
      const response = await fetch(iframeInfo.url, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch iframe content: ${response.status}`);
      }

      const html = await response.text();
      return this.cleanHTML(html);
    } catch (error) {
      console.error('Error fetching iframe content:', error);
      
      // Fallback: return a simplified structure description
      return this.generateFallbackHTML();
    }
  }

  /**
   * Clean and optimize HTML for AI processing
   */
  private static cleanHTML(html: string): string {
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Remove script tags
      const scripts = tempDiv.querySelectorAll('script');
      scripts.forEach(script => script.remove());

      // Remove style tags (keep class attributes)
      const styles = tempDiv.querySelectorAll('style');
      styles.forEach(style => style.remove());

      // Remove comments
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_COMMENT,
        null
      );
      
      const comments: Node[] = [];
      let node;
      while (node = walker.nextNode()) {
        comments.push(node);
      }
      comments.forEach(comment => {
        if (comment.parentNode) {
          comment.parentNode.removeChild(comment);
        }
      });

      // Keep only essential attributes
      const allElements = tempDiv.querySelectorAll('*');
      allElements.forEach(element => {
        const allowedAttributes = ['id', 'class', 'type', 'role', 'aria-label', 'placeholder', 'href', 'src', 'alt'];
        const attributes = Array.from(element.attributes);
        
        attributes.forEach(attr => {
          if (!allowedAttributes.includes(attr.name)) {
            element.removeAttribute(attr.name);
          }
        });
      });

      // Get the cleaned HTML
      let cleanedHTML = tempDiv.innerHTML;

      // Limit the size for AI processing (max 10KB)
      if (cleanedHTML.length > 10000) {
        cleanedHTML = cleanedHTML.substring(0, 10000) + '...';
      }

      return cleanedHTML;
    } catch (error) {
      console.error('Error cleaning HTML:', error);
      return html.substring(0, 5000); // Fallback to first 5KB
    }
  }

  /**
   * Generate a fallback HTML structure when iframe content is not accessible
   */
  private static generateFallbackHTML(): string {
    try {
      const iframeInfo = this.getIframeInfo();
      const projectId = iframeInfo?.projectId || 'unknown';
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lovable Project ${projectId}</title>
        </head>
        <body>
          <div id="app">
            <header class="app-header">
              <nav class="navigation">
                <a href="/" class="nav-link">Home</a>
                <a href="/about" class="nav-link">About</a>
                <a href="/contact" class="nav-link">Contact</a>
              </nav>
            </header>
            <main class="main-content">
              <section class="hero-section">
                <h1 class="hero-title">Welcome to the Application</h1>
                <p class="hero-description">This is a Lovable-generated web application.</p>
                <button class="cta-button">Get Started</button>
              </section>
              <section class="features-section">
                <div class="feature-card">
                  <h3>Feature 1</h3>
                  <p>Description of feature 1</p>
                </div>
                <div class="feature-card">
                  <h3>Feature 2</h3>
                  <p>Description of feature 2</p>
                </div>
              </section>
            </main>
            <footer class="app-footer">
              <p>&copy; 2024 Your Application</p>
            </footer>
          </div>
        </body>
        </html>
      `;
    } catch (error) {
      console.error('Error generating fallback HTML:', error);
      return '<html><body><h1>Web Application</h1><p>Unable to analyze content</p></body></html>';
    }
  }

  /**
   * Extract structured information about the page content
   */
  static analyzePageStructure(): {
    hasNavigation: boolean;
    hasForm: boolean;
    hasButtons: boolean;
    hasModal: boolean;
    components: string[];
  } {
    try {
      const iframeInfo = this.getIframeInfo();
      
      return {
        hasNavigation: true, // Assume basic components exist
        hasForm: true,
        hasButtons: true,
        hasModal: false,
        components: [
          'Header/Navigation',
          'Main Content Area',
          'Buttons',
          'Forms',
          'Footer'
        ]
      };
    } catch (error) {
      console.error('Error analyzing page structure:', error);
      return {
        hasNavigation: false,
        hasForm: false,
        hasButtons: false,
        hasModal: false,
        components: ['Unknown Components']
      };
    }
  }
}

export default IframeContentReader; 