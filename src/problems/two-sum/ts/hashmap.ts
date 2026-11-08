import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, cursor, fromMap, mark } from '../../../core/panels'

export function twoSum(nums: number[], target: number, t: Tracer = noop): number[] {
  const seen = new Map<number, number>() // [1] value -> index, for numbers already passed
  t.step(1, `Looking for two numbers that add to ${target}. Start with an empty memory of numbers seen.`, [arr(nums, { label: 'nums' }), buckets([], { label: 'seen', keyLabel: 'value → index', empty: 'nothing seen yet' })])
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i] // [2] the partner this number is hoping to find
    t.step(2, `Number ${nums[i]} at index ${i}. Its partner must be ${target} − ${nums[i]} = ${need}. Have I seen ${need}?`, [arr(nums, { label: 'nums', tones: cursor(nums.length, i), pointers: [{ name: 'i', at: i }] }), buckets(fromMap(seen, need), { label: 'seen', keyLabel: 'value → index', empty: 'nothing seen yet' })])
    const j = seen.get(need)
    if (j !== undefined) { // [3] partner already seen: that is the answer
      t.step(3, `Yes. ${need} is at index ${j}. ${need} + ${nums[i]} = ${target}. Answer: [${j}, ${i}].`, [arr(nums, { label: 'nums', tones: mark(nums.length, { [j]: 'hit', [i]: 'hit' }), pointers: [{ name: 'j', at: j, tone: 'hit' }, { name: 'i', at: i, tone: 'hit' }] }), buckets(fromMap(seen, need), { label: 'seen', keyLabel: 'value → index' })])
      return [j, i]
    }
    seen.set(nums[i], i) // [4] not found yet: remember this number for later
    t.step(4, `No ${need} yet. Remember ${nums[i]} at index ${i} and move on.`, [arr(nums, { label: 'nums', tones: cursor(nums.length, i + 1).map((x, k) => (k === i ? 'keep' : x)), pointers: [{ name: 'i', at: i }] }), buckets(fromMap(seen, nums[i]), { label: 'seen', keyLabel: 'value → index' })])
  }
  t.step(3, 'Reached the end without a pair. The problem promises one exists, so this input is invalid.', [arr(nums, { label: 'nums', tones: nums.map(() => 'miss' as const) }), buckets(fromMap(seen), { label: 'seen', keyLabel: 'value → index' })])
  return []
}
