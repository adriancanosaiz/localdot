import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { safeParse } from './common.ts'
import { ModelMessageSchema, normalizeToolCall } from './messages.ts'
import { ToolResultSchema, validateToolDescriptor, type Tool } from './tools.ts'

const descriptor = {
  name: 'read_file',
  description: 'Read a UTF-8 file inside the workspace.',
  inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  category: 'file',
} as const

describe('tool descriptor', () => {
  it('accepts a snake_case name', () => {
    expect(validateToolDescriptor(descriptor).ok).toBe(true)
  })

  it.each(['Read File', 'readFile', 'read-file', '1read', ''])('rejects name %j', (name) => {
    expect(validateToolDescriptor({ ...descriptor, name }).ok).toBe(false)
  })

  it('requires an object input schema', () => {
    const result = validateToolDescriptor({ ...descriptor, inputSchema: { type: 'string' } })
    expect(result.ok).toBe(false)
  })
})

describe('tool input validation', () => {
  const ReadFileInput = z.object({ path: z.string().min(1) })
  let executed = false
  const tool: Tool<z.infer<typeof ReadFileInput>> = {
    ...descriptor,
    parseInput: (raw) => safeParse(ReadFileInput, raw),
    assessRisk: () => ({ level: 'safe', reason: 'Read-only access inside the workspace' }),
    execute: () => {
      executed = true
      return Promise.resolve({ ok: true, observation: '' })
    },
  }

  it('returns a structured failure for invalid input instead of throwing', () => {
    const parsed = tool.parseInput({ path: 42 })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toContain('path')
    expect(executed).toBe(false)
  })

  it('returns the typed value for valid input', () => {
    expect(tool.parseInput({ path: 'package.json' })).toEqual({
      ok: true,
      value: { path: 'package.json' },
    })
  })
})

describe('tool result', () => {
  it('accepts a failed command result', () => {
    const result = ToolResultSchema.safeParse({
      ok: false,
      observation: 'Command exited with code 1:\nTypeError: x is undefined',
      exitCode: 1,
      durationMs: 830,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a truncated result without a full-output reference', () => {
    const result = ToolResultSchema.safeParse({ ok: true, observation: '…', truncated: true })
    expect(result.success).toBe(false)
  })

  it('accepts a truncated result with a full-output reference', () => {
    const result = ToolResultSchema.safeParse({
      ok: true,
      observation: '…',
      truncated: true,
      fullOutputRef: 'run_1/step_3/stdout',
    })
    expect(result.success).toBe(true)
  })
})

describe('model messages and tool calls', () => {
  it('rejects a tool message without a tool call id', () => {
    expect(ModelMessageSchema.safeParse({ role: 'tool', content: 'ok' }).success).toBe(false)
  })

  it('parses valid JSON arguments', () => {
    const call = normalizeToolCall('call_1', 'read_file', '{"path":"package.json"}')
    expect(call.arguments).toEqual({ path: 'package.json' })
    expect(call.parseError).toBeUndefined()
  })

  it('treats empty arguments as an empty object', () => {
    expect(normalizeToolCall('call_1', 'list_files', '').arguments).toEqual({})
  })

  it('preserves raw text and marks the failure for unparseable arguments', () => {
    const call = normalizeToolCall('call_1', 'read_file', '{"path": "package.json"')
    expect(call.arguments).toBeUndefined()
    expect(call.rawArguments).toBe('{"path": "package.json"')
    expect(call.parseError).toBeTypeOf('string')
    const message = ModelMessageSchema.safeParse({
      role: 'assistant',
      content: '',
      toolCalls: [call],
    })
    expect(message.success).toBe(true)
  })
})
