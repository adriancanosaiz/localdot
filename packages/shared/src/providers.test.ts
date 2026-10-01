import { describe, expect, it } from 'vitest'

import { ModelStreamEventSchema, ProviderConfigSchema } from './providers.ts'

const lmStudio = {
  id: 'lmstudio',
  name: 'LM Studio',
  baseUrl: 'http://localhost:1234/v1',
  model: 'qwen3.8-27b',
}

describe('provider config', () => {
  it('accepts a local server without an API key', () => {
    expect(ProviderConfigSchema.safeParse(lmStudio).success).toBe(true)
  })

  it('accepts an Ollama endpoint on 127.0.0.1', () => {
    const config = { ...lmStudio, id: 'ollama', baseUrl: 'http://127.0.0.1:11434/v1' }
    expect(ProviderConfigSchema.safeParse(config).success).toBe(true)
  })

  it.each(['ftp://localhost:1234/v1', 'localhost:1234/v1', 'file:///tmp/socket', 'not a url'])(
    'rejects base URL %j',
    (baseUrl) => {
      expect(ProviderConfigSchema.safeParse({ ...lmStudio, baseUrl }).success).toBe(false)
    },
  )

  it('rejects an empty API key instead of treating it as configured', () => {
    expect(ProviderConfigSchema.safeParse({ ...lmStudio, apiKey: '' }).success).toBe(false)
  })
})

describe('model stream events', () => {
  it('rejects an unknown event type', () => {
    expect(ModelStreamEventSchema.safeParse({ type: 'done' }).success).toBe(false)
  })

  it('accepts a finish event', () => {
    expect(ModelStreamEventSchema.safeParse({ type: 'finish', reason: 'tool_calls' }).success).toBe(
      true,
    )
  })
})
