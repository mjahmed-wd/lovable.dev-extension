// API configuration
const API_BASE_URL = 'http://65.21.182.200:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Test {
  _id: string;
  name: string;
  description?: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  errorMessage?: string;
  testData?: any;
  tags: string[];
  userId: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

// Storage for authentication token
class TokenStorage {
  private static TOKEN_KEY = 'lovable_extension_token';

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

// Base API class with authentication handling
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = TokenStorage.getToken();
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData: { name: string; email: string; password: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/me');
  }

  // Task methods
  async getTasks(params?: {
    status?: Task['status'];
    priority?: Task['priority'];
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Task[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request(`/tasks${query ? `?${query}` : ''}`);
  }

  async createTask(taskData: Omit<Task, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<{ data: Task }>> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, taskData: Partial<Omit<Task, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<{ data: Task }>> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Test methods
  async getTests(params?: {
    status?: Test['status'];
    type?: Test['type'];
    taskId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Test[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request(`/tests${query ? `?${query}` : ''}`);
  }

  async createTest(testData: Omit<Test, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<{ data: Test }>> {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }

  async updateTest(id: string, testData: Partial<Omit<Test, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<{ data: Test }>> {
    return this.request(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
    });
  }

  async deleteTest(id: string): Promise<ApiResponse> {
    return this.request(`/tests/${id}`, {
      method: 'DELETE',
    });
  }

  async runTest(id: string): Promise<ApiResponse<{ data: Test }>> {
    return this.request(`/tests/${id}/run`, {
      method: 'POST',
    });
  }

  async generateAITestCases(htmlContent: string, projectContext?: string): Promise<TestCaseGenerated[]> {
    const response = await this.request<TestCaseGenerated[]>('/tests/generate-ai', {
      method: 'POST',
      body: JSON.stringify({
        htmlContent,
        projectContext,
      }),
    });

    return response.data || [];
  }

  async generateAIDocument(
    htmlContent: string,
    conversationData?: ConversationData,
    documentType?: string,
    customPrompt?: string,
    projectContext?: string,
    url?: string
  ): Promise<DocumentGenerated> {
    const response = await this.request<DocumentGenerated>('/documents/generate-ai', {
      method: 'POST',
      body: JSON.stringify({
        htmlContent,
        conversationData,
        documentType,
        customPrompt,
        projectContext,
        url,
      }),
    });

    return response.data || { title: 'Error', content: 'Failed to generate document', type: 'requirements' };
  }

  async getDocuments(): Promise<StoredDocument[]> {
    const response = await this.request<StoredDocument[]>('/documents', {
      method: 'GET',
    });

    return response.data || [];
  }

  async downloadDocx(documentId: string): Promise<Blob> {
    const token = TokenStorage.getToken();
    
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/docx`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // Expert Hub methods
  async submitHireExpertRequest(request: HireExpertRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request('/experts/hire', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async submitExpertRegistration(request: RegisterExpertRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request('/experts/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Add interface for AI-generated test cases
export interface TestCaseGenerated {
  title: string;
  description: string;
  steps: Array<{
    description: string;
  }>;
  expectedResult: string;
  priority: 'low' | 'medium' | 'high';
}

// Add interface for AI-generated documents
export interface DocumentGenerated {
  title: string;
  content: string;
  type: 'requirements' | 'specs' | 'guides' | 'api' | 'faq';
  documentId?: string;
  createdAt?: string;
}

// Add interface for stored documents
export interface StoredDocument {
  _id: string;
  title: string;
  content: string;
  documentType: 'requirement' | 'specification' | 'plan' | 'documentation' | 'other';
  customPrompt?: string;
  url?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Add interface for conversation data
export interface ConversationData {
  userMessages: Array<{ sender: 'user'; text: string; timestamp?: string }>;
  aiMessages: Array<{ sender: 'ai'; text: string; timestamp?: string }>;
  mergedMessages: Array<{ sender: 'user' | 'ai'; text: string; timestamp?: string }>;
  url?: string;
  title?: string;
}

// Expert Hub interfaces
export interface HireExpertRequest {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
}

export interface RegisterExpertRequest {
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: string;
  portfolio?: string;
  hourlyRate?: string;
  bio: string;
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export { TokenStorage };
export type { User, Task, Test, ApiResponse }; 