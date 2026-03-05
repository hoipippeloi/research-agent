/**
 * TypeScript type definitions for Qwen3.5-4B LLM Gateway
 * OpenAI-compatible API types
 */

// ============================================
// Chat Message Types
// ============================================

export type ChatRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
  function_call?: FunctionCall;
  tool_calls?: ToolCall[];
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

// ============================================
// Chat Completion Request Types
// ============================================

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  response_format?: ResponseFormat;
  tools?: Tool[];
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
}

export interface ResponseFormat {
  type: 'text' | 'json_object';
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

// ============================================
// Chat Completion Response Types
// ============================================

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: UsageInfo;
  system_fingerprint?: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null;
  logprobs?: {
    content: Array<{
      token: string;
      logprob: number;
      bytes: number[] | null;
      top_logprobs: Array<{
        token: string;
        logprob: number;
        bytes: number[] | null;
      }>;
    }> | null;
  };
}

export interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// ============================================
// Streaming Response Types
// ============================================

export interface ChatCompletionStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionStreamChoice[];
  system_fingerprint?: string;
}

export interface ChatCompletionStreamChoice {
  index: number;
  delta: ChatCompletionStreamDelta;
  finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null;
  logprobs?: {
    content: Array<{
      token: string;
      logprob: number;
      bytes: number[] | null;
      top_logprobs: Array<{
        token: string;
        logprob: number;
        bytes: number[] | null;
      }>;
    }> | null;
  };
}

export interface ChatCompletionStreamDelta {
  role?: ChatRole;
  content?: string;
  function_call?: Partial<FunctionCall>;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: 'function';
    function?: Partial<FunctionCall>;
  }>;
}

// ============================================
// Model Types
// ============================================

export interface ModelInfo {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  permission?: ModelPermission[];
  root?: string;
  parent?: string;
}

export interface ModelPermission {
  id: string;
  object: 'model_permission';
  created: number;
  allow_create_engine: boolean;
  allow_sampling: boolean;
  allow_logprobs: boolean;
  allow_search_indices: boolean;
  allow_view: boolean;
  allow_fine_tuning: boolean;
  organization: string;
  group: string | null;
  is_blocking: boolean;
}

export interface ModelsResponse {
  object: 'list';
  data: ModelInfo[];
}

// ============================================
// Error Types
// ============================================

export interface ErrorResponse {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
}

export type ErrorCode =
  | 'invalid_api_key'
  | 'insufficient_quota'
  | 'rate_limit_exceeded'
  | 'invalid_request_error'
  | 'model_not_found'
  | 'context_length_exceeded'
  | 'content_filter';

export class LLMGatewayError extends Error {
  public type: string;
  public code: ErrorCode | string;
  public param: string | null;
  public status?: number;

  constructor(message: string, type: string, code: ErrorCode | string, param: string | null = null, status?: number) {
    super(message);
    this.name = 'LLMGatewayError';
    this.type = type;
    this.code = code;
    this.param = param;
    this.status = status;
  }
}

// ============================================
// Client Configuration Types
// ============================================

export interface LLMGatewayConfig {
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  response_format?: ResponseFormat;
  user?: string;
}

// ============================================
// Health Check Types
// ============================================

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  model?: string;
  uptime?: number;
  version?: string;
  timestamp?: number;
}

// ============================================
// Utility Types
// ============================================

export type AsyncIterableStream<T> = AsyncIterable<T> & {
  controller?: AbortController;
};

export interface StreamOptions {
  signal?: AbortSignal;
}

// ============================================
// Function/Tool Calling Types (Advanced)
// ============================================

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export type ChatCompletionFunctions = FunctionDefinition;

// ============================================
// Export all types
// ============================================

export type {
  ChatRole,
  ChatMessage,
  FunctionCall,
  ToolCall,
  ChatCompletionRequest,
  ResponseFormat,
  Tool,
  ChatCompletionResponse,
  ChatCompletionChoice,
  UsageInfo,
  ChatCompletionStreamChunk,
  ChatCompletionStreamChoice,
  ChatCompletionStreamDelta,
  ModelInfo,
  ModelsResponse,
  ErrorResponse,
  LLMGatewayConfig,
  RequestOptions,
  HealthCheckResponse,
  AsyncIterableStream,
  StreamOptions,
  FunctionDefinition,
  ChatCompletionFunctions,
};
