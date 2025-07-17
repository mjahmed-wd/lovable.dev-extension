import { GoogleGenerativeAI } from '@google/generative-ai';
import winston from 'winston';

// Winston logger setup
const aiLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ai-errors.log', level: 'error' })
  ]
});

export interface TestCaseGenerated {
  title: string;
  description: string;
  steps: Array<{
    description: string;
  }>;
  expectedResult: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DocumentGenerated {
  title: string;
  content: string;
  type: 'requirements' | 'specs' | 'guides' | 'api' | 'faq';
}

export interface ConversationData {
  userMessages: Array<{ sender: 'user'; text: string; timestamp?: string }>;
  aiMessages: Array<{ sender: 'ai'; text: string; timestamp?: string }>;
  mergedMessages: Array<{ sender: 'user' | 'ai'; text: string; timestamp?: string }>;
  url?: string;
  title?: string;
}

export interface AIProvider {
  generateTestCases(htmlContent: string, projectContext?: string): Promise<TestCaseGenerated[]>;
  generateDocument(
    htmlContent: string,
    conversationData?: ConversationData,
    documentType?: string,
    customPrompt?: string,
    projectContext?: string
  ): Promise<DocumentGenerated>;
}

class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private fallbackModels: string[] = [
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b'
  ];

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateTestCases(htmlContent: string, projectContext?: string): Promise<TestCaseGenerated[]> {
    const prompt = this.buildPrompt(htmlContent, projectContext);
    
    for (const modelName of this.fallbackModels) {
      try {
        console.log(`[AI] Trying model: ${modelName}`);
        const result = await this.tryGenerateWithRetry(modelName, prompt, 2);
        console.log(`[AI] Model ${modelName} succeeded.`);
        return result;
      } catch (error) {
        // Log detailed error to file
        aiLogger.error({
          message: 'AI model error',
          model: modelName,
          error: error instanceof Error ? error.stack || error.message : error,
          time: new Date().toISOString()
        });
        // Print simplified error to terminal
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status === 503) {
            console.log(`[AI] Model overloaded (${modelName}), retrying or switching...`);
          } else if (status === 429) {
            console.log(`[AI] Rate limit hit for model (${modelName}), retrying or switching...`);
          } else {
            console.log(`[AI] Model ${modelName} failed with status ${status}`);
          }
        } else {
          console.log(`[AI] Model ${modelName} failed, switching to next.`);
        }
        // Print a clear message if this model failed after all retries
        console.log(`[AI] Model ${modelName} failed after retries.`);
      }
    }
    
    console.log('[AI] All models failed. See logs/ai-errors.log for details.');
    throw new Error('All AI models failed to generate test cases. Please try again later.');
  }

  private async tryGenerateWithRetry(modelName: string, prompt: string, maxRetries: number): Promise<TestCaseGenerated[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return this.parseTestCases(text);
      } catch (error) {
        lastError = error as Error;
        // Log detailed error to file
        aiLogger.error({
          message: 'AI model retry error',
          model: modelName,
          attempt,
          error: error instanceof Error ? error.stack || error.message : error,
          time: new Date().toISOString()
        });
        // Print simplified error to terminal
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status === 503) {
            console.log(`[AI] Overloaded (${modelName}), waiting and retrying...`);
          } else if (status === 429) {
            console.log(`[AI] Rate limit hit (${modelName}), waiting and retrying...`);
          } else {
            console.log(`[AI] Attempt ${attempt} failed for ${modelName} (status ${status}), retrying...`);
          }
        } else {
          console.log(`[AI] Attempt ${attempt} failed for ${modelName}, retrying...`);
        }
        // Wait before retrying if appropriate
        if (error && typeof error === 'object' && 'status' in error && ((error as any).status === 503 || (error as any).status === 429)) {
          const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
          await this.sleep(waitTime);
          continue;
        }
        break;
      }
    }
    throw lastError || new Error(`Failed to generate with ${modelName} after ${maxRetries} attempts`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildPrompt(htmlContent: string, projectContext?: string): string {
    return `You are an expert QA engineer. Analyze the following HTML structure from a web application and generate comprehensive test cases.

${projectContext ? `Project Context: ${projectContext}` : ''}

HTML Structure:
${htmlContent}

Generate 5-8 test cases that cover:
1. Basic functionality tests
2. User interaction tests  
3. UI/UX validation tests
4. Error handling scenarios
5. Edge cases

For each test case, provide:
- Title: Clear, concise test case name
- Description: What this test validates
- Steps: Detailed step-by-step instructions
- Expected Result: What should happen
- Priority: low, medium, or high

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Test case title",
    "description": "Test case description",
    "steps": [
      {"description": "Step 1 description"},
      {"description": "Step 2 description"}
    ],
    "expectedResult": "Expected outcome",
    "priority": "medium"
  }
]

IMPORTANT: Return ONLY the JSON array. Do not include any other text, explanations, or markdown formatting.`;
  }

  private parseTestCases(responseText: string): TestCaseGenerated[] {
    try {
      // Clean the response to extract JSON
      let jsonText = responseText.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const testCases = JSON.parse(jsonText);
      
      if (!Array.isArray(testCases)) {
        throw new Error('Response is not an array');
      }
      
      return testCases.map(tc => ({
        title: tc.title || 'Generated Test Case',
        description: tc.description || '',
        steps: Array.isArray(tc.steps) ? tc.steps : [{ description: 'No steps provided' }],
        expectedResult: tc.expectedResult || 'Test should pass',
        priority: ['low', 'medium', 'high'].includes(tc.priority) ? tc.priority : 'medium'
      }));
      
    } catch (error) {
      aiLogger.error({
        message: 'Error parsing AI response',
        error: error instanceof Error ? error.stack || error.message : error,
        time: new Date().toISOString()
      });
      console.log('[AI] Error parsing AI response. See logs/ai-errors.log for details.');
      // Fallback: return a default test case
      return [{
        title: 'AI Generated Test Case',
        description: 'Failed to parse AI response, manual review needed',
        steps: [{ description: 'Review the generated content manually' }],
        expectedResult: 'Manual verification required',
        priority: 'medium'
      }];
    }
  }

  async generateDocument(
    htmlContent: string,
    conversationData?: ConversationData,
    documentType: string = 'requirements',
    customPrompt?: string,
    projectContext?: string
  ): Promise<DocumentGenerated> {
    const prompt = this.buildDocumentPrompt(htmlContent, conversationData, documentType, customPrompt, projectContext);
    
    for (const modelName of this.fallbackModels) {
      try {
        console.log(`[AI] Trying model for document generation: ${modelName}`);
        const result = await this.tryGenerateDocumentWithRetry(modelName, prompt, 2);
        console.log(`[AI] Model ${modelName} succeeded for document generation.`);
        return result;
      } catch (error) {
        aiLogger.error({
          message: 'AI document generation error',
          model: modelName,
          error: error instanceof Error ? error.stack || error.message : error,
          time: new Date().toISOString()
        });
        console.log(`[AI] Model ${modelName} failed for document generation.`);
      }
    }
    
    console.log('[AI] All models failed for document generation. See logs/ai-errors.log for details.');
    throw new Error('All AI models failed to generate document. Please try again later.');
  }

  private async tryGenerateDocumentWithRetry(modelName: string, prompt: string, maxRetries: number): Promise<DocumentGenerated> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return this.parseDocumentResponse(text);
      } catch (error) {
        lastError = error as Error;
        aiLogger.error({
          message: 'AI document retry error',
          model: modelName,
          attempt,
          error: error instanceof Error ? error.stack || error.message : error,
          time: new Date().toISOString()
        });
        
        if (error && typeof error === 'object' && 'status' in error && ((error as any).status === 503 || (error as any).status === 429)) {
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          await this.sleep(waitTime);
          continue;
        }
        break;
      }
    }
    throw lastError || new Error(`Failed to generate document with ${modelName} after ${maxRetries} attempts`);
  }

  private buildDocumentPrompt(
    htmlContent: string,
    conversationData?: ConversationData,
    documentType: string = 'requirements',
    customPrompt?: string,
    projectContext?: string
  ): string {
    const documentDescriptions = {
      requirements: 'comprehensive project requirements document',
      specs: 'detailed technical specifications',
      guides: 'user-friendly documentation and guides',
      api: 'API documentation',
      faq: 'frequently asked questions and answers'
    };

    let prompt = customPrompt || `You are an expert technical writer. Generate a ${documentDescriptions[documentType as keyof typeof documentDescriptions] || 'documentation'} based on the provided information.`;

    if (projectContext) {
      prompt += `\n\nProject Context: ${projectContext}`;
    }

    if (conversationData && conversationData.mergedMessages.length > 0) {
      prompt += `\n\nConversation Data:`;
      conversationData.mergedMessages.forEach((msg, index) => {
        prompt += `\n${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`;
      });
    }

    prompt += `\n\nHTML Structure:\n${htmlContent}`;

    prompt += `\n\nGenerate a well-structured, comprehensive ${documentType} document. Return ONLY a JSON object with this exact structure:
{
  "title": "Document title",
  "content": "Document content in markdown format",
  "type": "${documentType}"
}

IMPORTANT: Return ONLY the JSON object. Do not include any other text, explanations, or markdown formatting.`;

    return prompt;
  }

  private parseDocumentResponse(responseText: string): DocumentGenerated {
    try {
      let jsonText = responseText.trim();
      
      // Handle multiple markdown code block formats
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the response if it's embedded in other text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const document = JSON.parse(jsonText);
      
      return {
        title: document.title || 'Generated Document',
        content: document.content || 'Document content could not be parsed.',
        type: document.type || 'requirements'
      };
      
    } catch (error) {
      aiLogger.error({
        message: 'Error parsing AI document response',
        error: error instanceof Error ? error.stack || error.message : error,
        time: new Date().toISOString()
      });
      console.log('[AI] Error parsing AI document response. See logs/ai-errors.log for details.');
      
      // Try to extract content from the raw response as fallback
      let fallbackContent = responseText;
      
      // If there's a content field visible in the raw response, try to extract it
      const contentMatch = responseText.match(/"content":\s*"([^"]*(?:\\.[^"]*)*)"/);
      if (contentMatch) {
        try {
          fallbackContent = JSON.parse(`"${contentMatch[1]}"`); // Parse the escaped string
        } catch {
          fallbackContent = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      }
      
      return {
        title: 'AI Generated Document',
        content: fallbackContent,
        type: 'requirements'
      };
    }
  }
}

// Future providers can be added here (OpenAI, Anthropic, etc.)
class OpenAIProvider implements AIProvider {
  constructor(apiKey: string) {
    // TODO: Implement OpenAI provider
  }

  async generateTestCases(htmlContent: string, projectContext?: string): Promise<TestCaseGenerated[]> {
    throw new Error('OpenAI provider not yet implemented');
  }

  async generateDocument(
    htmlContent: string,
    conversationData?: ConversationData,
    documentType?: string,
    customPrompt?: string,
    projectContext?: string
  ): Promise<DocumentGenerated> {
    throw new Error('OpenAI provider not yet implemented');
  }
}

export class AIService {
  private provider: AIProvider;

  constructor(providerType: 'gemini' | 'openai' = 'gemini', apiKey: string) {
    switch (providerType) {
      case 'gemini':
        this.provider = new GeminiProvider(apiKey);
        break;
      case 'openai':
        this.provider = new OpenAIProvider(apiKey);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${providerType}`);
    }
  }

  async generateTestCases(htmlContent: string, projectContext?: string): Promise<TestCaseGenerated[]> {
    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('HTML content is required for test case generation');
    }

    return this.provider.generateTestCases(htmlContent, projectContext);
  }

  async generateDocument(
    htmlContent: string,
    conversationData?: ConversationData,
    documentType?: string,
    customPrompt?: string,
    projectContext?: string
  ): Promise<DocumentGenerated> {
    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('HTML content is required for document generation');
    }

    return this.provider.generateDocument(htmlContent, conversationData, documentType, customPrompt, projectContext);
  }
}

export default AIService; 