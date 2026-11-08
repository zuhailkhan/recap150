import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, cursor, fromMap } from '../../../core/panels'

export function topKFrequent(nums: number[], k: number, t: Tracer = noop): number[] {
  const count = new Map<number, number>() // [1] value -> how many times it appears
  t.step(1, `Find the ${k} most frequent value${k === 1 ? '' : 's'}. First, count how often each value appears.`, [arr(nums, { label: 'nums' }), buckets([], { label: 'count', keyLabel: 'value → times', empty: 'nothing counted yet' })])
  for (let i = 0; i < nums.length; i++) {
    count.set(nums[i], (count.get(nums[i]) ?? 0) + 1) // [1] one more for this value
    t.step(1, `Value ${nums[i]}. Its count is now ${count.get(nums[i])}.`, [arr(nums, { label: 'nums', tones: cursor(nums.length, i), pointers: [{ name: 'i', at: i }] }), buckets(fromMap(count, nums[i]), { label: 'count', keyLabel: 'value → times' })])
  }
  const byFreq: number[][] = Array.from({ length: nums.length + 1 }, () => []) // [2] slot f holds the values seen f times
  for (const [x, c] of count) {
    byFreq[c].push(x) // [2] the count is the slot number
    t.step(2, `Value ${x} appears ${c} time${c === 1 ? '' : 's'}, so it goes in slot ${c}. The frequency is the index.`, [buckets(fromMap(count, x), { label: 'count', keyLabel: 'value → times' }), buckets(byFreq.map((xs, f) => ({ key: String(f), items: xs, tone: f === c ? 'focus' as const : undefined })).slice(1), { label: 'slots', keyLabel: 'appears this many times' })])
  }
  const out: number[] = []
  for (let f = nums.length; f >= 1 && out.length < k; f--) { // [3] walk from the highest slot down
    for (const x of byFreq[f]) out.push(x)
    t.step(3, byFreq[f].length === 0 ? `Slot ${f} is empty. Nobody appears ${f} times. Go down one.` : `Slot ${f} holds ${byFreq[f].join(', ')}. Take ${byFreq[f].length === 1 ? 'it' : 'them'}. ${out.length} of ${k} chosen.`, [buckets(byFreq.map((xs, g) => ({ key: String(g), items: xs, tone: g === f ? (xs.length ? 'hit' as const : 'focus' as const) : g > f ? 'dim' as const : undefined })).slice(1), { label: 'slots', keyLabel: 'appears this many times' }), arr(out, { label: 'chosen', tones: out.map(() => 'hit' as const) })])
  }
  return out.slice(0, k)
}
