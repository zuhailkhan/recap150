import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, bits } from '../../../core/panels'
import { diff, lit, low, wd } from './viz'

export function hammingWeight(n: number, t: Tracer = noop): number {
  let x = n >>> 0 // [1] read n as an unsigned 32-bit number
  let count = 0
  t.step(1, `Start with x = ${x}. Count its 1 bits by removing them one at a time.`, [bits([{ label: 'x', value: x }], { width: wd(x) }), arr([count], { label: 'count', tones: ['keep'] })])
  while (x !== 0) {
    const next = (x & (x - 1)) >>> 0 // [2] x - 1 flips the lowest 1 and the zeros below it, so AND clears that 1
    t.step(2, `x - 1 flips the lowest 1 and every 0 under it. AND with x keeps the rest and clears that lowest 1. x becomes ${next}.`, [bits([{ label: 'x', value: x, tones: low(wd(x), x, 'focus') }, { label: 'x−1', value: x - 1, tones: diff(wd(x), x, x - 1, 'focus') }, { label: 'AND', value: next, tones: low(wd(x), x, 'hit') }], { width: wd(x) })])
    x = next
    count++ // [3] one 1 bit removed, so one more counted
    t.step(3, `One 1 bit removed, so count is ${count}. ${x === 0 ? 'x is 0: no 1 bits left.' : `x = ${x} still has 1 bits.`}`, [bits([{ label: 'x', value: x }], { width: wd(n >>> 0) }), arr([count], { label: 'count', tones: ['keep'] })])
  }
  t.step(3, `x is 0, so all ${count} of the 1 bits in ${n >>> 0} have been removed and counted.`, [bits([{ label: 'n', value: n >>> 0, tones: lit(wd(n >>> 0), n >>> 0, 'hit') }], { width: wd(n >>> 0) }), arr([count], { label: 'count', tones: ['hit'] })])
  return count // [3] x is 0, so every 1 bit has been counted
}
