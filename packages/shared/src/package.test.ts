import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

describe('@localdot/shared package', () => {
  it('depends on nothing but zod at runtime', () => {
    const manifest = JSON.parse(readFileSync(`${packageRoot}/package.json`, 'utf8')) as {
      dependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(['zod'])
    expect(manifest.peerDependencies).toBeUndefined()
  })

  it('imports from a plain Node process without a bundler or DOM', () => {
    const script = `
      const shared = await import('./src/index.ts')
      if (typeof window !== 'undefined') throw new Error('unexpected DOM')
      console.log(JSON.stringify(shared.resolveLimits()))
    `
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: packageRoot,
      encoding: 'utf8',
    })
    expect(JSON.parse(output)).toMatchObject({ maxSteps: 30 })
  })
})
