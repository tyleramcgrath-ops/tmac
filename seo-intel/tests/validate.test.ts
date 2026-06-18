import { describe, expect, it } from 'vitest'
import { validateCountry, validateKeyword, validateLanguage, validateUrl } from '@/lib/validate'

describe('validateUrl', () => {
  it('accepts a full https URL', () => {
    const r = validateUrl('https://example.com/page')
    expect(r.ok).toBe(true)
    expect(r.value).toBe('https://example.com/page')
  })

  it('adds https:// to bare domains', () => {
    const r = validateUrl('example.com/pricing')
    expect(r.ok).toBe(true)
    expect(r.value).toBe('https://example.com/pricing')
  })

  it('rejects empty input', () => {
    expect(validateUrl('').ok).toBe(false)
    expect(validateUrl('   ').ok).toBe(false)
  })

  it('rejects URLs with spaces', () => {
    expect(validateUrl('https://example.com/a page').ok).toBe(false)
  })

  it('rejects non-http protocols', () => {
    expect(validateUrl('ftp://example.com').ok).toBe(false)
    expect(validateUrl('javascript:alert(1)').ok).toBe(false)
  })

  it('rejects localhost and private addresses (SSRF protection)', () => {
    expect(validateUrl('http://localhost:3000').ok).toBe(false)
    expect(validateUrl('http://127.0.0.1/admin').ok).toBe(false)
    expect(validateUrl('http://192.168.1.1').ok).toBe(false)
    expect(validateUrl('http://10.0.0.5/x').ok).toBe(false)
    expect(validateUrl('http://172.16.0.1').ok).toBe(false)
    expect(validateUrl('http://169.254.169.254/latest/meta-data').ok).toBe(false)
    expect(validateUrl('http://internal.local').ok).toBe(false)
  })

  it('rejects hostnames without a TLD', () => {
    expect(validateUrl('http://intranet').ok).toBe(false)
  })
})

describe('validateKeyword', () => {
  it('accepts and normalizes whitespace', () => {
    const r = validateKeyword('  best   crm  software ')
    expect(r.ok).toBe(true)
    expect(r.value).toBe('best crm software')
  })

  it('rejects empty and too-long keywords', () => {
    expect(validateKeyword('').ok).toBe(false)
    expect(validateKeyword('x'.repeat(200)).ok).toBe(false)
  })
})

describe('validateCountry / validateLanguage', () => {
  it('accepts 2-letter country codes', () => {
    expect(validateCountry('US').value).toBe('us')
    expect(validateCountry('gbr').ok).toBe(false)
  })

  it('accepts language codes and empty language', () => {
    expect(validateLanguage('en').ok).toBe(true)
    expect(validateLanguage('en-GB').ok).toBe(true)
    expect(validateLanguage(undefined).ok).toBe(true)
    expect(validateLanguage('english').ok).toBe(false)
  })
})
