import { z } from 'zod'

import { IdSchema } from './common.ts'

/**
 * A tool call normalized from any provider's wire format.
 *
 * `rawArguments` is always kept so that malformed JSON from the model can be reported back to it
 * instead of crashing the run. When parsing fails, `arguments` is `undefined` and `parseError` is set.
 * The name is not validated here: an unknown or malformed name is a model mistake the runtime
 * reports back, not a contract violation.
 */
export const ToolCallSchema = z.object({
  id: IdSchema,
  name: z.string(),
  arguments: z.unknown(),
  rawArguments: z.string(),
  parseError: z.string().optional(),
})
export type ToolCall = z.infer<typeof ToolCallSchema>

export const SystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.string(),
})

export const UserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.string(),
})

export const AssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: z.string(),
  toolCalls: z.array(ToolCallSchema).optional(),
})

export const ToolMessageSchema = z.object({
  role: z.literal('tool'),
  toolCallId: IdSchema,
  content: z.string(),
})

/** Provider-neutral conversation message. Providers translate to and from their own formats. */
export const ModelMessageSchema = z.discriminatedUnion('role', [
  SystemMessageSchema,
  UserMessageSchema,
  AssistantMessageSchema,
  ToolMessageSchema,
])
export type ModelMessage = z.infer<typeof ModelMessageSchema>
export type SystemMessage = z.infer<typeof SystemMessageSchema>
export type UserMessage = z.infer<typeof UserMessageSchema>
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>
export type ToolMessage = z.infer<typeof ToolMessageSchema>

/** Builds a {@link ToolCall} from raw JSON argument text, recording parse failures instead of throwing. */
export function normalizeToolCall(id: string, name: string, rawArguments: string): ToolCall {
  const raw = rawArguments.trim() === '' ? '{}' : rawArguments
  try {
    return { id, name, arguments: JSON.parse(raw) as unknown, rawArguments }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { id, name, arguments: undefined, rawArguments, parseError: message }
  }
}
