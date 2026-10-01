import { z } from 'zod'

import { IdSchema, ToolNameSchema } from './common.ts'
import type { Workspace } from './workspace.ts'

export const RISK_LEVELS = ['safe', 'requires_approval', 'denied'] as const
export const RiskLevelSchema = z.enum(RISK_LEVELS)
export type RiskLevel = z.infer<typeof RiskLevelSchema>

/** A tool's own view of how risky a specific invocation is. The gateway has the final word. */
export const RiskAssessmentSchema = z.object({
  level: RiskLevelSchema,
  reason: z.string().min(1),
})
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>

export const PERMISSION_OUTCOMES = ['allow', 'approval_required', 'deny'] as const
export const PermissionOutcomeSchema = z.enum(PERMISSION_OUTCOMES)
export type PermissionOutcome = z.infer<typeof PermissionOutcomeSchema>

export const PermissionDecisionSchema = z.object({
  outcome: PermissionOutcomeSchema,
  /** Why this outcome was chosen, e.g. "git push publishes commits to a remote". */
  reason: z.string().min(1),
  /** Human-readable description of the action, e.g. "Run `git push origin main`". */
  summary: z.string().min(1),
})
export type PermissionDecision = z.infer<typeof PermissionDecisionSchema>

export interface PermissionRequest {
  readonly toolName: string
  /** Input already validated against the tool's schema. */
  readonly input: unknown
  readonly risk: RiskAssessment
  readonly workspace: Workspace
  readonly runId: string
  readonly step: number
}

/** The single place where security decisions are made. */
export interface PermissionGateway {
  evaluate(request: PermissionRequest): PermissionDecision | Promise<PermissionDecision>
}

export const ApprovalRequestSchema = z.object({
  id: IdSchema,
  runId: IdSchema,
  step: z.int().positive(),
  toolName: ToolNameSchema,
  summary: z.string().min(1),
  reason: z.string().min(1),
  input: z.unknown(),
})
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>

/** MVP only knows one-off decisions; "always allow" is intentionally absent. */
export const APPROVAL_RESOLUTIONS = ['approved', 'denied'] as const
export const ApprovalResolutionSchema = z.enum(APPROVAL_RESOLUTIONS)
export type ApprovalResolution = z.infer<typeof ApprovalResolutionSchema>

/** Suspends the run until a human resolves the request. Rejects if `signal` aborts first. */
export interface ApprovalBroker {
  request(request: ApprovalRequest, signal: AbortSignal): Promise<ApprovalResolution>
}
