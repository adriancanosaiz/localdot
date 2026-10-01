import { z } from 'zod'

import { IdSchema, TokenUsageSchema } from './common.ts'
import { ToolCallSchema, type ModelMessage } from './messages.ts'
import type { ToolDescriptor } from './tools.ts'

export const ModelCapabilitiesSchema = z.object({
  tools: z.boolean(),
  streaming: z.boolean(),
  reasoning: z.boolean(),
})
export type ModelCapabilities = z.infer<typeof ModelCapabilitiesSchema>

const HttpUrlSchema = z.url({ protocol: /^https?$/, hostname: z.regexes.hostname })

/**
 * User-facing configuration for an OpenAI-compatible endpoint (LM Studio, Ollama, MLX servers,
 * hosted APIs). Local servers need no API key.
 */
export const ProviderConfigSchema = z.object({
  id: IdSchema,
  /** Display name, e.g. "LM Studio". */
  name: z.string().min(1),
  baseUrl: HttpUrlSchema,
  apiKey: z.string().min(1).optional(),
  model: z.string().min(1),
  contextWindow: z.int().positive().optional(),
  capabilities: ModelCapabilitiesSchema.partial().optional(),
})
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>

export const ModelInfoSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  /** True when inference happens on this machine (no data leaves it, no API cost). */
  local: z.boolean(),
  contextWindow: z.int().positive().optional(),
})
export type ModelInfo = z.infer<typeof ModelInfoSchema>

export interface ModelRequest {
  readonly messages: readonly ModelMessage[]
  readonly tools: readonly ToolDescriptor[]
  readonly temperature?: number
  readonly maxOutputTokens?: number
}

export const FINISH_REASONS = ['stop', 'tool_calls', 'length', 'content_filter', 'error'] as const
export const FinishReasonSchema = z.enum(FINISH_REASONS)
export type FinishReason = z.infer<typeof FinishReasonSchema>

/** Normalized streaming events. Provider wire formats never leak past the provider. */
export const ModelStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text-delta'), text: z.string() }),
  z.object({ type: z.literal('reasoning-delta'), text: z.string() }),
  z.object({ type: z.literal('tool-call'), toolCall: ToolCallSchema }),
  z.object({ type: z.literal('usage'), usage: TokenUsageSchema }),
  z.object({
    type: z.literal('finish'),
    reason: FinishReasonSchema,
    error: z.string().optional(),
  }),
])
export type ModelStreamEvent = z.infer<typeof ModelStreamEventSchema>

/**
 * A model backend. Only streaming is required: a non-streaming call is a collected stream.
 * Implementations must stop and release the connection when `signal` aborts.
 */
export interface ModelProvider {
  readonly info: ModelInfo
  readonly capabilities: ModelCapabilities
  stream(request: ModelRequest, signal: AbortSignal): AsyncIterable<ModelStreamEvent>
}
