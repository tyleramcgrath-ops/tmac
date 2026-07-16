import { describe, it, expect } from 'vitest'
import { normalizeApplicationPassword, looksLikeApplicationPassword } from '../credentials'

describe('normalizeApplicationPassword', () => {
  it('strips spaces from the standard WordPress display format', () => {
    expect(normalizeApplicationPassword('abcd EFGH ijkl MNOP qrst UVWX')).toBe('abcdEFGHijklMNOPqrstUVWX')
  })

  it('strips leading/trailing whitespace', () => {
    expect(normalizeApplicationPassword('  abcd1234efgh5678ijkl9012  ')).toBe('abcd1234efgh5678ijkl9012')
  })

  it('leaves a password with no spaces unchanged', () => {
    expect(normalizeApplicationPassword('abcd1234efgh5678ijkl9012')).toBe('abcd1234efgh5678ijkl9012')
  })

  it('handles tabs and newlines as whitespace too', () => {
    expect(normalizeApplicationPassword('abcd\tEFGH\nijkl MNOP')).toBe('abcdEFGHijklMNOP')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeApplicationPassword('')).toBe('')
  })

  it('never trims non-whitespace characters that look meaningful', () => {
    // Regression guard: an earlier .trim()-only implementation preserved internal
    // spaces, which this function must strip without touching any other character.
    const withInternalSpace = 'ab cd 12 34 ef gh 56 78 ij kl 90 12'
    const normalized = normalizeApplicationPassword(withInternalSpace)
    expect(normalized).toBe('abcd1234efgh5678ijkl9012')
    expect(normalized.length).toBe(24)
  })
})

describe('looksLikeApplicationPassword', () => {
  it('accepts the standard 24-char lowercase alphanumeric format', () => {
    expect(looksLikeApplicationPassword('abcd1234efgh5678ijkl9012')).toBe(true)
  })

  it('rejects a short value', () => {
    expect(looksLikeApplicationPassword('tooshort')).toBe(false)
  })

  it('rejects a value with symbols', () => {
    expect(looksLikeApplicationPassword('abcd-1234-efgh-5678-ijkl-9012')).toBe(false)
  })
})
