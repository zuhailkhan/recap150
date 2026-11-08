import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, cursor, mark } from '../../../core/panels'

export function containsDuplicate(nums: number[], t: Tracer = noop): boolean {
  const seen = new Set<number>() // [1] numbers already passed
  t.step(1, 'Start with an empty set. It will hold every number passed so far.', [arr(nums, { label: 'nums' }), arr([], { label: 'seen' })])
  for (let i = 0; i < nums.length; i++) {
    const x = nums[i] // [2] look at the next number
    t.step(2, `Number ${x} at index ${i}. Is ${x} already in the set?`, [arr(nums, { label: 'nums', tones: cursor(nums.length, i), pointers: [{ name: 'i', at: i }] }), arr([...seen], { label: 'seen', tones: [...seen].map((v) => (v === x ? 'hit' : null)) })])
    if (seen.has(x)) { // [3] met this value before: duplicate
      t.step(3, `Yes. ${x} was seen before. A value appears twice, so the answer is true.`, [arr(nums, { label: 'nums', tones: nums.map((v, k) => (k <= i && v === x ? 'hit' : k < i ? 'dim' : null)), pointers: [{ name: 'i', at: i, tone: 'hit' }] }), arr([...seen], { label: 'seen', tones: [...seen].map((v) => (v === x ? 'hit' : null)) })])
      return true
    }
    seen.add(x) // [4] new value: remember it
    t.step(4, `No. ${x} is new. Add it to the set and move on.`, [arr(nums, { label: 'nums', tones: cursor(nums.length, i + 1).map((v, k) => (k === i ? 'keep' : v)), pointers: [{ name: 'i', at: i }] }), arr([...seen], { label: 'seen', tones: mark(seen.size, { [seen.size - 1]: 'keep' }) })])
  }
  t.step(3, 'End of the list and nothing repeated. The answer is false.', [arr(nums, { label: 'nums', tones: nums.map(() => 'dim' as const) }), arr([...seen], { label: 'seen', tones: [...seen].map(() => 'keep' as const) })])
  return false // [3] no repeat anywhere
}
