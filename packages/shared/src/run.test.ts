import { describe, expect, it } from 'vitest'

import {
  AgentRunSchema,
  AgentStepSchema,
  RunStatusSchema,
  isTerminalStatus,
  type AgentRun,
  type AgentStep,
} from './run.ts'

const now = '2026-10-01T12:00:00.000Z'

const run: AgentRun = {
  id: 'run_1',
  task: 'Fix the failing tests',
  workspaceId: 'ws_1',
  model: { providerId: 'lmstudio', modelId: 'qwen3.8-27b' },
  status: 'running',
  createdAt: now,
  startedAt: now,
  steps: [],
  errorCount: 0,
  toolCallCount: 0,
  runtimeMs: 0,
}

const step: AgentStep = {
  runId: 'run_1',
  step: 1,
  timestamp: now,
  model: run.model,
  toolName: 'read_file',
  arguments: { path: 'package.json' },
  result: '{ "name": "demo" }',
  durationMs: 12,
  filesChanged: [],
  status: 'running',
}

describe('run status', () => {
  it('rejects an unknown status and names the field', () => {
    const result = AgentRunSchema.safeParse({ ...run, status: 'stopped' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['status'])
  })

  it('identifies terminal statuses', () => {
    expect(isTerminalStatus('completed')).toBe(true)
    expect(isTerminalStatus('failed')).toBe(true)
    expect(isTerminalStatus('cancelled')).toBe(true)
    expect(isTerminalStatus('running')).toBe(false)
    expect(isTerminalStatus('waiting_approval')).toBe(false)
  })

  it('accepts every declared status', () => {
    for (const status of RunStatusSchema.options) {
      expect(RunStatusSchema.safeParse(status).success).toBe(true)
    }
  })
})

describe('agent run record', () => {
  it('accepts a running run without termination reason', () => {
    expect(AgentRunSchema.safeParse(run).success).toBe(true)
  })

  it('rejects a terminal run without termination reason', () => {
    const result = AgentRunSchema.safeParse({ ...run, status: 'failed', endedAt: now })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['terminationReason'])
  })

  it('accepts a terminal run with termination reason', () => {
    const result = AgentRunSchema.safeParse({
      ...run,
      status: 'failed',
      endedAt: now,
      terminationReason: 'max_steps',
    })
    expect(result.success).toBe(true)
  })
})

describe('agent step record', () => {
  it('accepts a complete step', () => {
    expect(AgentStepSchema.safeParse(step).success).toBe(true)
  })

  it('rejects step number 0', () => {
    expect(AgentStepSchema.safeParse({ ...step, step: 0 }).success).toBe(false)
  })

  it('rejects fractional step numbers', () => {
    expect(AgentStepSchema.safeParse({ ...step, step: 1.5 }).success).toBe(false)
  })
})
