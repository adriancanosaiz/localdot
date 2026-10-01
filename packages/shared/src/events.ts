import { z } from 'zod'

import { IdSchema, TimestampSchema, ToolNameSchema } from './common.ts'
import {
  ApprovalRequestSchema,
  ApprovalResolutionSchema,
  PermissionOutcomeSchema,
} from './permissions.ts'
import {
  AgentPhaseSchema,
  ModelRefSchema,
  RunStatusSchema,
  TerminationReasonSchema,
} from './run.ts'
import { ToolCategorySchema } from './tools.ts'

const base = { runId: IdSchema, at: TimestampSchema }

/**
 * Everything a UI, logger or persistence layer needs to follow a run, without access to the
 * runtime's internals. Events are plain JSON so they can cross process boundaries (SSE, IPC).
 */
export const AgentEventSchema = z.discriminatedUnion('type', [
  z.object({
    ...base,
    type: z.literal('run.started'),
    task: z.string(),
    model: ModelRefSchema,
    workspaceId: IdSchema,
  }),
  z.object({
    ...base,
    type: z.literal('phase.changed'),
    phase: AgentPhaseSchema,
    /** Optional focus, e.g. the file being read or the command being run. */
    detail: z.string().optional(),
  }),
  z.object({ ...base, type: z.literal('step.started'), step: z.int().positive() }),
  z.object({
    ...base,
    type: z.literal('model.delta'),
    step: z.int().positive(),
    channel: z.enum(['text', 'reasoning']),
    text: z.string(),
  }),
  z.object({
    ...base,
    type: z.literal('tool.started'),
    step: z.int().positive(),
    toolCallId: IdSchema,
    toolName: ToolNameSchema,
    category: ToolCategorySchema,
    /** Human-readable action, e.g. "Read package.json". */
    summary: z.string(),
    permission: PermissionOutcomeSchema,
  }),
  z.object({
    ...base,
    type: z.literal('tool.finished'),
    step: z.int().positive(),
    toolCallId: IdSchema,
    toolName: ToolNameSchema,
    ok: z.boolean(),
    /** Short preview for the UI; the full result lives in the step record. */
    preview: z.string(),
    durationMs: z.number().nonnegative(),
    exitCode: z.int().optional(),
    filesChanged: z.array(z.string()),
  }),
  z.object({ ...base, type: z.literal('approval.requested'), request: ApprovalRequestSchema }),
  z.object({
    ...base,
    type: z.literal('approval.resolved'),
    requestId: IdSchema,
    resolution: ApprovalResolutionSchema,
  }),
  z.object({
    ...base,
    type: z.literal('loop.warning'),
    step: z.int().positive(),
    kind: z.enum(['repeated_tool_call', 'no_progress', 'error_streak']),
    message: z.string(),
  }),
  z.object({
    ...base,
    type: z.literal('run.finished'),
    status: RunStatusSchema.extract(['completed', 'failed', 'cancelled']),
    reason: TerminationReasonSchema,
    summary: z.string().optional(),
    steps: z.int().nonnegative(),
    runtimeMs: z.number().nonnegative(),
  }),
])
export type AgentEvent = z.infer<typeof AgentEventSchema>
export type AgentEventType = AgentEvent['type']
