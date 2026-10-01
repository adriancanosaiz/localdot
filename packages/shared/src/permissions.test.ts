import { describe, expect, it } from 'vitest'

import {
  ApprovalRequestSchema,
  ApprovalResolutionSchema,
  PermissionDecisionSchema,
} from './permissions.ts'

describe('permission decision', () => {
  const decision = {
    outcome: 'approval_required',
    reason: 'git push publishes commits to a remote',
    summary: 'Run `git push origin main`',
  }

  it('accepts a complete decision', () => {
    expect(PermissionDecisionSchema.safeParse(decision).success).toBe(true)
  })

  it('rejects a decision without a reason', () => {
    const { reason: _omitted, ...withoutReason } = decision
    expect(PermissionDecisionSchema.safeParse(withoutReason).success).toBe(false)
    expect(PermissionDecisionSchema.safeParse({ ...decision, reason: '' }).success).toBe(false)
  })

  it('rejects an unknown outcome', () => {
    expect(PermissionDecisionSchema.safeParse({ ...decision, outcome: 'ask' }).success).toBe(false)
  })
})

describe('approvals', () => {
  it('only knows approved and denied', () => {
    expect(ApprovalResolutionSchema.options).toEqual(['approved', 'denied'])
    expect(ApprovalResolutionSchema.safeParse('always').success).toBe(false)
  })

  it('accepts a complete approval request', () => {
    const request = {
      id: 'appr_1',
      runId: 'run_1',
      step: 4,
      toolName: 'run_command',
      summary: 'Run `git push origin main`',
      reason: 'git push publishes commits to a remote',
      input: { command: 'git push origin main' },
    }
    expect(ApprovalRequestSchema.safeParse(request).success).toBe(true)
  })
})
