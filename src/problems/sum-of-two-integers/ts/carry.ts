import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { bits } from '../../../core/panels'
import { lit, wd } from './viz'

export function getSum(a: number, b: number, t: Tracer = noop): number {
  t.step(1, `Add ${a} and ${b} with no + or -. Think column addition: a holds the sum so far, b holds the carries still to add.`, [bits([{ label: 'a', value: a }, { label: 'b', value: b }], { width: wd(a, b, a & b) })])
  while (b !== 0) { // [1] keep going while a carry is left to add
    const carry = (a & b) << 1 // [2] columns where both bits are 1 carry into the next column on the left
    t.step(2, `Both bits are 1 in the lit columns of a AND b. Shifted left by one, the carries are ${carry}.`, [bits([{ label: 'a', value: a }, { label: 'b', value: b }, { label: 'AND', value: a & b, tones: lit(wd(a, b, carry), a & b, 'focus') }, { label: 'carry', value: carry, tones: lit(wd(a, b, carry), carry, 'hit') }], { width: wd(a, b, carry) })])
    a ^= b // [3] XOR is the column sum with the carry left out
    t.step(3, `XOR adds each column and ignores the carry: ${a ^ b} ^ ${b} = ${a}. The carry ${carry} is still waiting.`, [bits([{ label: 'a', value: a ^ b }, { label: 'b', value: b }, { label: 'a^b', value: a, tones: lit(wd(a, b, carry), a, 'focus') }], { width: wd(a, b, carry) })])
    b = carry // [4] the carries are what is left to add to a
    t.step(4, `Now add the carry ${b} to ${a}. ${b === 0 ? 'The carry is 0, so nothing is left to add.' : 'Repeat.'}`, [bits([{ label: 'a', value: a }, { label: 'b', value: b, tones: lit(wd(a, b, carry), b, 'hit') }], { width: wd(a, b, carry) })])
  }
  t.step(1, `b is 0, so no carry remains. The answer is a = ${a}.`, [bits([{ label: 'a', value: a, tones: lit(wd(a), a, 'hit') }], { width: wd(a) })])
  return a // [1] no carry left, so a is the sum
}
