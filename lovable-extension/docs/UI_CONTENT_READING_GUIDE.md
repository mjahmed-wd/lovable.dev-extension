# UI Content Reading Guide

This guide explains how to read content from web pages using Chrome extension APIs in your extension.

## Overview

Your Chrome extension can read and analyze content from any web page using the Chrome scripting API. This is useful for:

- **Documentation Generation**: Analyze UI elements to generate docs
- **Test Case Creation**: Extract form fields and buttons for testing
- **Content Analysis**: Understanding page structure and content
- **Automation**: Building workflows based on page content

## Prerequisites

### 1. Manifest Permissions

Make sure your `manifest.json` includes these permissions:

```json
{
  "permissions": [
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ]
}
```

### 2. Import the Utility

```typescript
import { 
  captureUIContent, 
  captureTextContent, 
  captureElementsBySelector 
} from '../utils/uiContentReader';
```

## Basic Usage Examples

### 1. Capture All UI Content

```typescript
const handleCaptureContent = async () => {
  try {
    const content = await captureUIContent();
    console.log('Page content:', content);
    
    // Access different parts
    console.log('Forms:', content.forms);
    console.log('Headings:', content.headings);
    console.log('Buttons:', content.buttons);
    console.log('Links:', content.links);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 2. Capture Only Text Content

```typescript
const handleCaptureText = async () => {
  try {
    const text = await captureTextContent();
    console.log('Page text:', text);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 3. Find Specific Elements

```typescript
const handleFindButtons = async () => {
  try {
    // Find all buttons
    const buttons = await captureElementsBySelector('button');
    
    // Find elements by class
    const cards = await captureElementsBySelector('.card');
    
    // Find specific IDs
    const header = await captureElementsBySelector('#header');
    
    console.log('Found elements:', buttons);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Available Functions

### `captureUIContent()`
Returns comprehensive page data including:
- **Basic Info**: URL, title, body text
- **Forms**: All form elements with labels and types
- **Navigation**: Nav menus and links
- **Headings**: H1-H6 elements with hierarchy
- **Buttons**: All clickable buttons
- **Links**: All anchor tags
- **Images**: All images with alt text
- **Tables**: Table data with headers/rows
- **Lists**: Ordered and unordered lists
- **Metadata**: Meta tags and page info

### `captureTextContent()`
Returns only the visible text content of the page (lightweight).

### `captureElementsBySelector(selector)`
Find specific elements using CSS selectors:
- `'button'` - All buttons
- `'.className'` - Elements with specific class
- `'#elementId'` - Element with specific ID
- `'input[type="text"]'` - Specific input types
- `'div.card > h2'` - Complex selectors

### `captureFormData()`
Returns only form-related data from the page.

### `capturePageStructure()`
Returns page structure (title, headings, navigation, metadata).

## Real-World Use Cases

### 1. Generate Documentation

```typescript
const generateDocs = async () => {
  const content = await captureUIContent();
  
  // Analyze forms for API documentation
  const apiEndpoints = content.forms.map(form => ({
    endpoint: form.action,
    method: form.method,
    fields: form.elements.map(el => ({
      name: el.name,
      type: el.type,
      required: el.required,
      label: el.label
    }))
  }));
  
  // Use headings for document structure
  const pageStructure = content.headings.map(h => ({
    level: parseInt(h.level.replace('h', '')),
    title: h.text
  }));
  
  return { apiEndpoints, pageStructure };
};
```

### 2. Create Test Cases

```typescript
const generateTestCases = async () => {
  const content = await captureUIContent();
  
  // Generate test cases for forms
  const formTests = content.forms.map(form => ({
    title: `Test ${form.action} form submission`,
    steps: [
      ...form.elements.map(el => `Fill "${el.label}" field`),
      'Click submit button'
    ],
    expectedResult: 'Form submits successfully'
  }));
  
  // Generate test cases for navigation
  const navTests = content.buttons.map(btn => ({
    title: `Test "${btn.text}" button`,
    steps: [`Click "${btn.text}" button`],
    expectedResult: 'Expected action occurs'
  }));
  
  return [...formTests, ...navTests];
};
```

### 3. Content Analysis

```typescript
const analyzeContent = async () => {
  const content = await captureUIContent();
  
  return {
    pageType: detectPageType(content),
    complexity: calculateComplexity(content),
    accessibility: checkAccessibility(content),
    seo: analyzeSEO(content)
  };
};

const detectPageType = (content) => {
  if (content.forms.length > 0) return 'form-page';
  if (content.tables.length > 0) return 'data-page';
  if (content.headings.length > 5) return 'article-page';
  return 'general-page';
};
```

## Data Structure Reference

### UIContent Interface

```typescript
interface UIContent {
  url: string;              // Current page URL
  title: string;            // Page title
  bodyText: string;         // All visible text
  forms: FormData[];        // All forms
  navigation: string[];     // Navigation text
  headings: HeadingData[];  // H1-H6 elements
  buttons: ButtonData[];    // All buttons
  links: LinkData[];        // All links
  images: ImageData[];      // All images
  tables: TableData[];      // All tables
  lists: ListData[];        // All lists
  inputs: InputData[];      // All input fields
  metadata: MetaData;       // Page metadata
}
```

### Form Data

```typescript
interface FormData {
  id?: string;              // Form ID
  action?: string;          // Form action URL
  method?: string;          // HTTP method
  elements: FormElementData[]; // Form fields
}

interface FormElementData {
  type: string;             // Input type
  name: string;             // Field name
  placeholder: string;      // Placeholder text
  label: string;            // Associated label
  value?: string;           // Current value
  required?: boolean;       // Is required
}
```

## Error Handling

Always wrap calls in try-catch blocks:

```typescript
const safeContentCapture = async () => {
  try {
    const content = await captureUIContent();
    return content;
  } catch (error) {
    if (error.message.includes('permissions')) {
      alert('Please grant extension permissions');
    } else if (error.message.includes('active tab')) {
      alert('No active tab found');
    } else {
      alert('Failed to capture content');
    }
    return null;
  }
};
```

## Performance Tips

1. **Use Specific Functions**: Don't use `captureUIContent()` if you only need text
2. **Limit Text Length**: The utility already limits text to prevent memory issues
3. **Cache Results**: Store results to avoid repeated captures
4. **Use Selectors**: `captureElementsBySelector()` is more efficient for specific needs

## Troubleshooting

### Permission Errors
- Ensure `activeTab` and `scripting` permissions in manifest
- Check host permissions for the target domain

### No Content Returned
- Verify the page has finished loading
- Check if the page is accessible (not blocked by CSP)
- Try on a different page to test functionality

### Large Content Issues
- Use `captureTextContent()` for simple needs
- Implement pagination for large datasets
- Consider filtering content before processing

## Integration Examples

### With Your Test Cases Component

```typescript
// In TestCases.tsx
import { captureUIContent } from '../utils/uiContentReader';

const generateTestFromUI = async () => {
  const content = await captureUIContent();
  
  const newTestCase = {
    title: `Test ${content.title} page`,
    description: `Generated test for ${content.url}`,
    steps: content.buttons.map(btn => ({
      id: uuidv4(),
      description: `Click "${btn.text}" button`
    })),
    expectedResult: 'Page functions correctly',
    priority: 'medium' as Priority
  };
  
  addTestCase(newTestCase);
};
```

### With Documentation Generation

```typescript
// In DocumentGeneration.tsx
import { captureUIContent } from '../utils/uiContentReader';

const generateFromUI = async () => {
  const content = await captureUIContent();
  
  const documentation = `
# ${content.title}

## Overview
${content.metadata.description}

## Forms
${content.forms.map(form => `
### ${form.action}
- Method: ${form.method}
- Fields: ${form.elements.map(el => el.label).join(', ')}
`).join('')}

## Navigation
${content.headings.map(h => `${'#'.repeat(parseInt(h.level.replace('h', '')) + 1)} ${h.text}`).join('\n')}
  `;
  
  return documentation;
};
```

This comprehensive system gives you powerful tools to read and analyze any web page content for your extension features! 