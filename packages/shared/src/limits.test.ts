import { describe, expect, it } from 'vitest'

import { DEFAULT_LIMITS, resolveLimits } from './limits.ts'

describe('resolveLimits', () => {
  it('applies the defaults when no overrides are given', () => {
    const limits = resolveLimits()
    expect(limits).toEqual(DEFAULT_LIMITS)
    expect(limits.maxSteps).toBe(30)
    expect(limits.maxErrors).toBe(5)
    expect(limits.maxSameToolCall).toBe(3)
    expect(limits.maxConsecutiveNoProgress).toBe(3)
    for (const value of [limits.maxRuntimeMs, limits.toolTimeoutMs, limits.maxObservationChars]) {
      expect(Number.isFinite(value)).toBe(true)
      expect(value).toBeGreaterThan(0)
    }
  })

  it('keeps remaining defaults on partial override', () => {
    expect(resolveLimits({ maxSteps: 10 })).toEqual({ ...DEFAULT_LIMITS, maxSteps: 10 })
  })

  it.each([0, -1, Infinity, Number.NaN])('rejects maxSteps = %s', (maxSteps) => {
    expect(() => resolveLimits({ maxSteps })).toThrow()
  })

  it('rejects an unbounded runtime', () => {
    expect(() => resolveLimits({ maxRuntimeMs: Infinity })).toThrow()
  })

  it('does not let callers mutate the defaults', () => {
    expect(Object.isFrozen(DEFAULT_LIMITS)).toBe(true)
  })
})
