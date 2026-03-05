/**
 * Qwen3.5-4B LLM Gateway Client
 *
 * OpenAI-compatible TypeScript client for interacting with the Qwen3.5-4B inference server.
 * Supports both streaming and non-streaming completions.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
  response_format?: { type: 'text' | 'json_object' };
}

export interface ChatCompletionChoice {
  index: number;
  message?: {
    role: 'assistant';
    content: string;
  };
  delta?: {
    role?: 'assistant';
    content?: string;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  defaultModel?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

export interface StreamOptions {
  onChunk?: (chunk: ChatCompletionResponse) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Custom Errors
// ============================================================================

export class LLMGatewayError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseData?: unknown
  ) {
    super(message);
    this.name = 'LLMGatewayError';
  }
}

export class LLMGatewayTimeoutError extends LLMGatewayError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'LLMGatewayTimeoutError';
  }
}

export class LLMGatewayConnectionError extends LLMGatewayError {
  constructor(message: string) {
    super(message);
    this.name = 'LLMGatewayConnectionError';
  }
}

// ============================================================================
// LLM Gateway Client
// ============================================================================

export class LLMGatewayClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private defaultModel: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 120000; // 2 minutes default
    this.defaultModel = config.defaultModel || 'qwen3.5-4b';
    this.defaultTemperature = config.defaultTemperature ?? 0.7;
    this.defaultMaxTokens = config.defaultMaxTokens || 2048;
  }

  private getDefaultBaseUrl(): string {
    // Auto-detect environment
    if (typeof window !== 'undefined') {
      // Browser environment
      return import.meta.env?.VITE_LLM_GATEWAY_URL || 'http://localhost:8080/v1';
    } else if (typeof process !== 'undefined') {
      // Node.js environment
      return process.env.LLM_GATEWAY_URL || 'http://localhost:8080/v1';
    }
    return 'http://localhost:8080/v1';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new LLMGatewayError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof LLMGatewayError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new LLMGatewayTimeoutError(this.timeout);
        }
        throw new LLMGatewayConnectionError(error.message);
      }

      throw new LLMGatewayError('Unknown error occurred');
    }
  }

  // ============================================================================
  // Chat Completions API
  // ============================================================================

  /**
   * Create a chat completion (non-streaming)
   */
  async createChatCompletion(
    messages: ChatMessage[],
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<ChatCompletionResponse> {
    const requestBody: ChatCompletionRequest = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? this.defaultTemperature,
      max_tokens: options.max_tokens ?? this.defaultMaxTokens,
      stream: false,
      ...options,
    };

    return this.makeRequest<ChatCompletionResponse>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Create a streaming chat completion
   */
  async *streamChatCompletion(
    messages: ChatMessage[],
    options: Partial<ChatCompletionRequest> = {},
    streamOptions?: StreamOptions
  ): AsyncGenerator<ChatCompletionResponse, void, unknown> {
    const requestBody: ChatCompletionRequest = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? this.defaultTemperature,
      max_tokens: options.max_tokens ?? this.defaultMaxTokens,
      stream: true,
      ...options,
    };

    const url = `${this.baseUrl}/chat/completions`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new LLMGatewayError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      if (!response.body) {
        throw new LLMGatewayError('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const json = trimmed.slice(6);
              const chunk = JSON.parse(json) as ChatCompletionResponse;

              if (streamOptions?.onChunk) {
                streamOptions.onChunk(chunk);
              }

              yield chunk;
            } catch (error) {
              console.warn('Failed to parse streaming chunk:', trimmed);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof LLMGatewayError) {
        if (streamOptions?.onError) {
          streamOptions.onError(error);
        }
        throw error;
      }

      const wrappedError = new LLMGatewayConnectionError(
        error instanceof Error ? error.message : 'Unknown error'
      );

      if (streamOptions?.onError) {
        streamOptions.onError(wrappedError);
      }

      throw wrappedError;
    }
  }

  /**
   * Helper method to collect streaming response into a single string
   */
  async streamToString(
    messages: ChatMessage[],
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<string> {
    let fullContent = '';

    for await (const chunk of this.streamChatCompletion(messages, options)) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
      }
    }

    return fullContent;
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  /**
   * Simple completion helper
   */
  async complete(
    prompt: string,
    systemPrompt?: string,
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.createChatCompletion(messages, options);

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Code generation helper
   */
  async generateCode(
    prompt: string,
    language?: string,
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<string> {
    const systemPrompt = language
      ? `You are an expert ${language} developer. Generate clean, efficient, and well-documented code.`
      : 'You are an expert software developer. Generate clean, efficient, and well-documented code.';

    return this.complete(prompt, systemPrompt, {
      temperature: 0.3,
      ...options,
    });
  }

  /**
   * JSON mode helper
   */
  async completeJSON<T = unknown>(
    prompt: string,
    systemPrompt?: string,
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<T> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.createChatCompletion(messages, {
      ...options,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new LLMGatewayError('Failed to parse JSON response');
    }
  }

  // ============================================================================
  // Health & Status
  // ============================================================================

  /**
   * Check if the gateway is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/v1', '')}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get gateway status
   */
  async getStatus(): Promise<{ status: string; model?: string }> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/v1', '')}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new LLMGatewayError('Failed to get status');
      }

      return await response.json();
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new LLM Gateway client instance
 */
export function createClient(config?: ClientConfig): LLMGatewayClient {
  return new LLMGatewayClient(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default LLMGatewayClient;
