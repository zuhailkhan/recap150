import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function longestConsecutive(nums: number[], t: Tracer = noop): number {
  const set = new Set(nums) // [1] instant "is this number present?"
  t.step(1, `Put every number in a set. Now "is ${[...set][0] ?? 'x'} present?" is one step, and duplicates are gone.`, [arr([...set], { label: 'set (as a list)' })])
  let best = 0
  for (const x of set) {
    if (set.has(x - 1)) { // [2] x - 1 exists, so x is in the middle of a run. Skip it
      t.step(2, `${x}: ${x - 1} is in the set, so ${x} is not the start of a run. Skip it.`, [arr([...set], { label: 'set (as a list)', tones: [...set].map((v) => (v === x ? 'dim' : v === x - 1 ? 'keep' : null)), pointers: [{ name: 'x', at: [...set].indexOf(x), tone: 'dim' }] }), arr([best], { label: 'best' })])
      continue
    }
    t.step(2, `${x}: ${x - 1} is not in the set, so ${x} starts a run.`, [arr([...set], { label: 'set (as a list)', tones: [...set].map((v) => (v === x ? 'focus' : null)), pointers: [{ name: 'x', at: [...set].indexOf(x) }] }), arr([best], { label: 'best' })])
    let end = x // [3] walk upward while the next number exists
    while (set.has(end + 1)) end++
    t.step(3, `Walk up from ${x}: the run is ${Array.from({ length: end - x + 1 }, (_, k) => x + k).join(', ')}. That is ${end - x + 1} long.`, [arr([...set], { label: 'set (as a list)', tones: [...set].map((v) => (v >= x && v <= end ? 'hit' : null)) }), arr(Array.from({ length: end - x + 1 }, (_, k) => x + k), { label: 'run', tones: Array.from({ length: end - x + 1 }, () => 'hit' as const) })])
    best = Math.max(best, end - x + 1) // [4] keep the longest run seen
    t.step(4, `Longest so far: ${best}.`, [arr([...set], { label: 'set (as a list)', tones: [...set].map((v) => (v >= x && v <= end ? 'keep' : null)) }), arr([best], { label: 'best', tones: ['hit'] })])
  }
  return best
}
