import { z } from 'zod'

import { IdSchema, TimestampSchema, TokenUsageSchema, ToolNameSchema } from './common.ts'

/** Persisted lifecycle of a run. */
export const RUN_STATUSES = [
  'pending',
  'running',
  'waiting_approval',
  'completed',
  'failed',
  'cancelled',
] as const
export const RunStatusSchema = z.enum(RUN_STATUSES)
export type RunStatus = z.infer<typeof RunStatusSchema>

export const TERMINAL_RUN_STATUSES = ['completed', 'failed', 'cancelled'] as const
export type TerminalRunStatus = (typeof TERMINAL_RUN_STATUSES)[number]

export function isTerminalStatus(status: RunStatus): status is TerminalRunStatus {
  return (TERMINAL_RUN_STATUSES as readonly RunStatus[]).includes(status)
}

/** What the agent is doing right now. Drives the live UI. */
export const AGENT_PHASES = [
  'idle',
  'thinking',
  'running_tool',
  'waiting_approval',
  'paused',
  'completed',
  'failed',
  'cancelled',
] as const
export const AgentPhaseSchema = z.enum(AGENT_PHASES)
export type AgentPhase = z.infer<typeof AgentPhaseSchema>

/** Why a run stopped. Every terminal run carries one. */
export const TERMINATION_REASONS = [
  'final_answer',
  'max_steps',
  'max_errors',
  'max_runtime',
  'repeated_tool_call',
  'no_progress',
  'cancelled',
  'model_error',
  'internal_error',
] as const
export const TerminationReasonSchema = z.enum(TERMINATION_REASONS)
export type TerminationReason = z.infer<typeof TerminationReasonSchema>

export const ModelRefSchema = z.object({
  providerId: IdSchema,
  modelId: z.string().min(1),
})
export type ModelRef = z.infer<typeof ModelRefSchema>

/** One iteration of the agent loop: a model turn and, optionally, one tool execution. */
export const AgentStepSchema = z.object({
  runId: IdSchema,
  step: z.int().positive(),
  timestamp: TimestampSchema,
  model: ModelRefSchema,
  toolName: ToolNameSchema.optional(),
  toolCallId: IdSchema.optional(),
  arguments: z.unknown().optional(),
  /** Model-facing observation produced by the tool, possibly truncated. */
  result: z.string().optional(),
  error: z.string().optional(),
  exitCode: z.int().optional(),
  durationMs: z.number().nonnegative(),
  /** Workspace-relative paths changed by this step. */
  filesChanged: z.array(z.string()).default([]),
  usage: TokenUsageSchema.optional(),
  status: RunStatusSchema,
})
export type AgentStep = z.infer<typeof AgentStepSchema>

export const AgentRunSchema = z
  .object({
    id: IdSchema,
    task: z.string().min(1),
    workspaceId: IdSchema,
    model: ModelRefSchema,
    status: RunStatusSchema,
    createdAt: TimestampSchema,
    startedAt: TimestampSchema.optional(),
    endedAt: TimestampSchema.optional(),
    steps: z.array(AgentStepSchema).default([]),
    errorCount: z.int().nonnegative(),
    toolCallCount: z.int().nonnegative(),
    runtimeMs: z.number().nonnegative(),
    terminationReason: TerminationReasonSchema.optional(),
    /** Final answer or explanation shown to the user. */
    summary: z.string().optional(),
  })
  .refine((run) => !isTerminalStatus(run.status) || run.terminationReason !== undefined, {
    message: 'A terminal run must have a termination reason',
    path: ['terminationReason'],
  })
export type AgentRun = z.infer<typeof AgentRunSchema>
