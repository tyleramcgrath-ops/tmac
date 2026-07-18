import { describe, expect, it } from 'vitest'
import { toCsv } from '../app/lib/csv'

describe('toCsv: RFC 4180 quoting + formula-injection guard', () => {
  it('joins plain rows with commas and CRLF', () => {
    expect(toCsv([['a', 'b'], ['c', 'd']])).toBe('a,b\r\nc,d')
  })
  it('quotes and escapes cells containing commas, quotes, or newlines', () => {
    expect(toCsv([['has, comma', 'has "quote"', 'has\nnewline']])).toBe('"has, comma","has ""quote""","has\nnewline"')
  })
  it('passes through numbers unquoted', () => {
    expect(toCsv([[1, 2.5]])).toBe('1,2.5')
  })
  it('neutralizes a leading =, +, -, @ so a spreadsheet never executes it as a formula', () => {
    expect(toCsv([['=SUM(A1:A9)']])).toBe("'=SUM(A1:A9)")
    expect(toCsv([['+1234567']])).toBe("'+1234567")
    expect(toCsv([['-cmd|calc']])).toBe("'-cmd|calc")
    expect(toCsv([['@import']])).toBe("'@import")
  })
  it('does not touch a value that merely contains those characters mid-string', () => {
    expect(toCsv([['Q1 = target met']])).toBe('Q1 = target met')
  })
})
