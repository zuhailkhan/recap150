import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function findMin(nums: number[], t: Tracer = noop): number {
  let l = 0 // [1] the minimum is always inside nums[l..r]
  let r = nums.length - 1 // [1]
  t.step(1, `The minimum is somewhere in the whole array, index 0 to ${r}. Compare the middle with the right end to cut that range.`, [arr(nums, { label: 'rotated nums', pointers: [{ name: 'l', at: 0 }, { name: 'r', at: r }], window: [0, r] })])
  while (l < r) { // [2] more than one candidate left: look at the middle
    const m = l + Math.floor((r - l) / 2)
    t.step(2, `Middle is ${nums[m]} at index ${m}. The right end is ${nums[r]}. ${nums[m] > nums[r] ? `${nums[m]} is bigger than ${nums[r]}, so the drop is somewhere to the right.` : `${nums[m]} is not bigger than ${nums[r]}, so the right side is in order.`}`, [arr(nums, { label: 'rotated nums', tones: nums.map((_, i) => (i < l || i > r ? 'dim' : i === m ? 'focus' : i === r ? 'keep' : null)), pointers: [{ name: 'l', at: l }, { name: 'm', at: m, tone: 'focus' }, { name: 'r', at: r, tone: 'keep' }], window: [l, r] })])
    if (nums[m] > nums[r]) { // [3] m is in the high left part: the minimum is right of m
      l = m + 1
      t.step(3, `Everything up to index ${m} is in the high part. The minimum is to its right, so l = ${l}.`, [arr(nums, { label: 'rotated nums', tones: nums.map((_, i) => (i < l || i > r ? 'dim' : null)), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
    } else {
      r = m // [4] m is in the low right part: the minimum is m or left of m
      t.step(4, `The right side from index ${m} is in order, so the minimum is at ${m} or to its left. Keep m, and set r = ${r}.`, [arr(nums, { label: 'rotated nums', tones: nums.map((_, i) => (i < l || i > r ? 'dim' : null)), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
    }
  }
  t.step(5, `l and r both point at index ${l}. That cell, ${nums[l]}, is the minimum.`, [arr(nums, { label: 'rotated nums', tones: nums.map((_, i) => (i === l ? 'hit' : 'dim')), pointers: [{ name: 'l = r', at: l, tone: 'hit' }] })])
  return nums[l] // [5] one candidate left: it is the minimum
}
