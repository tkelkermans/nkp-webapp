import { ApiError, type ApiResponse, type Poll, type CreatePollInput } from '@/types';

// Browser: relative URLs (works with any domain via Ingress)
// SSR: use internal Kubernetes service name (INTERNAL_API_URL is runtime env var)
const API_URL = typeof window !== 'undefined' 
  ? ''  // Browser: relative URLs routed through Ingress
  : (process.env.INTERNAL_API_URL || 'http://backend-service:3001');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const config: RequestInit = {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();
      if (!response.ok) throw new ApiError(response.status, data.error || `HTTP error ${response.status}`);
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(408, 'La requête a expiré');
      }
      if (error instanceof Error) throw error;
      throw new Error('An unexpected error occurred');
    } finally {
      clearTimeout(timeout);
    }
  }

  async getPolls(): Promise<Poll[]> {
    const response = await this.request<Poll[]>('/api/polls');
    return response.data || [];
  }

  async getPoll(id: string): Promise<Poll> {
    const response = await this.request<Poll>(`/api/polls/${id}`);
    if (!response.data) throw new Error('Poll not found');
    return response.data;
  }

  async createPoll(input: CreatePollInput): Promise<Poll> {
    const response = await this.request<Poll>('/api/polls', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!response.data) throw new Error('Failed to create poll');
    return response.data;
  }

  async vote(pollId: string, optionId: string): Promise<Poll> {
    const response = await this.request<Poll>(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
    if (!response.data) throw new Error('Failed to vote');
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request('/api/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient(API_URL);
export default api;
