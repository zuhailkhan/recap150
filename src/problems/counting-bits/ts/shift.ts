import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, bits, mark } from '../../../core/panels'
import { lastFocus, lit, wd } from './viz'

export function countBits(n: number, t: Tracer = noop): number[] {
  const ans = new Array<number>(n + 1).fill(0) // [1] entry 0 stays 0, and every later entry is filled from earlier ones
  t.step(1, `Make room for 0..${n}. Zero has no 1 bits, so ans[0] = 0. Each later entry is built from a smaller one.`, [arr(ans.slice(0, 1), { label: 'ans', tones: ['hit'] })])
  for (let i = 1; i <= n; i++) {
    const half = ans[i >> 1] // [2] i >> 1 is i without its last bit. It is smaller, so already solved
    t.step(2, `i = ${i}. Dropping its last bit gives ${i >> 1}, and ans[${i >> 1}] = ${half} is already known.`, [bits([{ label: 'i', value: i, tones: lastFocus(wd(n), i) }, { label: 'i>>1', value: i >> 1, tones: lit(wd(n), i >> 1, 'keep') }], { width: wd(n) }), arr(ans.slice(0, i), { label: 'ans', tones: mark(i, { [i >> 1]: 'keep' }) })])
    ans[i] = half + (i & 1) // [3] add 1 back if the dropped bit was a 1
    t.step(3, `The dropped bit is ${i & 1}. ans[${i}] = ${half} + ${i & 1} = ${ans[i]}.`, [bits([{ label: 'i', value: i, tones: lastFocus(wd(n), i) }, { label: 'i>>1', value: i >> 1, tones: lit(wd(n), i >> 1, 'keep') }], { width: wd(n) }), arr(ans.slice(0, i + 1), { label: 'ans', tones: mark(i + 1, { [i >> 1]: 'keep', [i]: 'hit' }) })])
  }
  return ans
}
