import { z } from 'zod'

/** ISO-8601 timestamp with timezone, e.g. `2026-10-01T12:00:00.000Z`. */
export const TimestampSchema = z.iso.datetime({ offset: true })
export type Timestamp = z.infer<typeof TimestampSchema>

export const IdSchema = z.string().min(1).max(128)

/**
 * Tool names are lowercase snake_case so every provider accepts them as function names
 * (OpenAI-compatible servers reject spaces, dots and most punctuation).
 */
export const ToolNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,63}$/, 'Tool names must be lowercase snake_case (max 64 chars)')

/** JSON Schema describing a tool's input. Tools always take an object. */
export const JsonSchemaObjectSchema = z.looseObject({ type: z.literal('object') })
export type JsonSchemaObject = z.infer<typeof JsonSchemaObjectSchema>

export const TokenUsageSchema = z.object({
  inputTokens: z.int().nonnegative(),
  outputTokens: z.int().nonnegative(),
})
export type TokenUsage = z.infer<typeof TokenUsageSchema>

/** Outcome of validating untrusted data. Never throws. */
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

/** Validates `input` with `schema` and returns a {@link ParseResult} with a readable error. */
export function safeParse<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ParseResult<z.output<S>> {
  const result = schema.safeParse(input)
  if (result.success) return { ok: true, value: result.data }
  return { ok: false, error: z.prettifyError(result.error) }
}
