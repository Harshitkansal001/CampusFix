import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next-path'

describe('safeNextPath', () => {
  it('keeps same-origin paths and rejects external redirects', () => {
    const base = 'https://campusfix.example/auth/callback'

    expect(safeNextPath('/reports/123', base)).toBe('/reports/123')
    expect(safeNextPath('//evil.example', base)).toBe('/')
    expect(safeNextPath('/\\\\evil.example', base)).toBe('/')
    expect(safeNextPath('https://evil.example', base)).toBe('/')
    expect(safeNextPath(null, base)).toBe('/')
  })
})
