import { describe, expect, it } from 'vitest'
import { evalExpr, formatNum } from '../src/core/expr'

describe('evalExpr', () => {
  it('follows precedence and associativity', () => {
    expect(evalExpr('2 + 3 * 4', {})).toBe(14)
    expect(evalExpr('(2 + 3) * 4', {})).toBe(20)
    expect(evalExpr('2 ^ 3 ^ 2', {})).toBe(512)
    expect(evalExpr('-2 ^ 2', {})).toBe(4) // unary minus binds tighter than ^, like a calculator
    expect(evalExpr('10 - 4 - 3', {})).toBe(3)
    expect(evalExpr('100 / 10 / 5', {})).toBe(2)
  })
  it('uses variables and functions', () => {
    expect(evalExpr('dau * reads / 86400', { dau: 86400, reads: 5 })).toBe(5)
    expect(evalExpr('ceil(log2(1000))', {})).toBe(10)
    expect(evalExpr('max(1, min(5, 3))', {})).toBe(3)
    expect(evalExpr('1e3 + 2', {})).toBe(1002)
  })
  it('rejects anything that is not arithmetic', () => {
    expect(() => evalExpr('x + 1', {})).toThrow(/Unknown variable/)
    expect(() => evalExpr('process()', {})).toThrow(/Unknown function/)
    expect(() => evalExpr('constructor', {})).toThrow(/Unknown variable/)
    expect(() => evalExpr('1 +', {})).toThrow()
    expect(() => evalExpr('1 2', {})).toThrow()
    expect(() => evalExpr('a.b', { a: 1 })).toThrow()
    expect(() => evalExpr('__proto__', {})).toThrow(/Unknown variable/)
  })
})

describe('formatNum', () => {
  it('abbreviates large numbers', () => {
    expect(formatNum(1200)).toBe('1.2K')
    expect(formatNum(12_400_000)).toBe('12.4M')
    expect(formatNum(3_000_000_000)).toBe('3B')
    expect(formatNum(0.5)).toBe('0.5')
    expect(formatNum(Infinity)).toBe('∞')
  })
})
