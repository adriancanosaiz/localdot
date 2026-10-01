import { describe, expect, it } from 'vitest'

import { AgentEventSchema, type AgentEvent, type AgentEventType } from './events.ts'

const base = { runId: 'run_1', at: '2026-10-01T12:00:00.000Z' }

const fixtures: Record<AgentEventType, AgentEvent> = {
  'run.started': {
    ...base,
    type: 'run.started',
    task: 'Fix the failing tests',
    model: { providerId: 'lmstudio', modelId: 'qwen3.8-27b' },
    workspaceId: 'ws_1',
  },
  'phase.changed': { ...base, type: 'phase.changed', phase: 'running_tool', detail: 'src/auth.ts' },
  'step.started': { ...base, type: 'step.started', step: 1 },
  'model.delta': { ...base, type: 'model.delta', step: 1, channel: 'text', text: 'Reading…' },
  'tool.started': {
    ...base,
    type: 'tool.started',
    step: 1,
    toolCallId: 'call_1',
    toolName: 'read_file',
    category: 'file',
    summary: 'Read package.json',
    permission: 'allow',
  },
  'tool.finished': {
    ...base,
    type: 'tool.finished',
    step: 1,
    toolCallId: 'call_1',
    toolName: 'run_command',
    ok: false,
    preview: '3 tests failed',
    durationMs: 2140,
    exitCode: 1,
    filesChanged: [],
  },
  'approval.requested': {
    ...base,
    type: 'approval.requested',
    request: {
      id: 'appr_1',
      runId: 'run_1',
      step: 5,
      toolName: 'run_command',
      summary: 'Run `git push origin main`',
      reason: 'git push publishes commits to a remote',
      input: { command: 'git push origin main' },
    },
  },
  'approval.resolved': {
    ...base,
    type: 'approval.resolved',
    requestId: 'appr_1',
    resolution: 'denied',
  },
  'loop.warning': {
    ...base,
    type: 'loop.warning',
    step: 6,
    kind: 'repeated_tool_call',
    message: 'read_file(package.json) repeated 3 times',
  },
  'run.finished': {
    ...base,
    type: 'run.finished',
    status: 'completed',
    reason: 'final_answer',
    summary: 'Fixed the off-by-one in src/auth.ts; all 42 tests pass.',
    steps: 7,
    runtimeMs: 48_000,
  },
}

describe('agent events', () => {
  it.each(Object.entries(fixtures))('%s survives a JSON round trip', (_type, event) => {
    const parsed = AgentEventSchema.parse(JSON.parse(JSON.stringify(event)))
    expect(parsed).toEqual(event)
  })

  it('rejects an unknown event type', () => {
    expect(AgentEventSchema.safeParse({ ...base, type: 'run.paused' }).success).toBe(false)
  })

  it('requires run id and timestamp on every event', () => {
    const { runId: _runId, ...withoutRunId } = fixtures['step.started']
    expect(AgentEventSchema.safeParse(withoutRunId).success).toBe(false)
    expect(
      AgentEventSchema.safeParse({ ...fixtures['step.started'], at: 'yesterday' }).success,
    ).toBe(false)
  })

  it('only finishes runs with a terminal status', () => {
    const event = { ...fixtures['run.finished'], status: 'running' }
    expect(AgentEventSchema.safeParse(event).success).toBe(false)
  })
})
