import { z } from 'zod'

const positiveInt = z.int().positive()
const positiveFinite = z.number().positive()

/** Hard bounds enforced by the runtime. The model never decides when the loop ends on its own. */
export const AgentLimitsSchema = z.object({
  maxSteps: positiveInt,
  maxErrors: positiveInt,
  /** How many times the same canonical tool call may run before the loop intervenes. */
  maxSameToolCall: positiveInt,
  maxConsecutiveNoProgress: positiveInt,
  maxRuntimeMs: positiveFinite,
  toolTimeoutMs: positiveFinite,
  /** Upper bound for a single tool observation sent back to the model. */
  maxObservationChars: positiveInt,
})
export type AgentLimits = z.infer<typeof AgentLimitsSchema>

export const DEFAULT_LIMITS: Readonly<AgentLimits> = Object.freeze({
  maxSteps: 30,
  maxErrors: 5,
  maxSameToolCall: 3,
  maxConsecutiveNoProgress: 3,
  maxRuntimeMs: 20 * 60_000,
  toolTimeoutMs: 120_000,
  maxObservationChars: 12_000,
})

/** Merges overrides over {@link DEFAULT_LIMITS}. Throws if any resulting limit is not a positive finite number. */
export function resolveLimits(overrides: Partial<AgentLimits> = {}): AgentLimits {
  return AgentLimitsSchema.parse({ ...DEFAULT_LIMITS, ...overrides })
}
