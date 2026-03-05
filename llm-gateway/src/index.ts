/**
 * LLM Gateway Client
 *
 * OpenAI-compatible client for Qwen3.5-4B inference server
 * Supports both local development and Railway deployment
 */

export type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChoice,
  ChatCompletionUsage,
  StreamChunk,
  LLMClientConfig
} from './types';

export { LLMClient } from './client';
export { createClient } from './client';

// Convenience exports for common use cases
export type { default as LLMGateway } from './client';
