import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function search(nums: number[], target: number, t: Tracer = noop): number {
  let l = 0 // [1] the live range is nums[l..r]
  let r = nums.length - 1 // [1]
  t.step(1, `Looking for ${target}. The live range is the whole array, index 0 to ${r}.`, [arr(nums, { label: 'sorted nums', pointers: r >= 0 ? [{ name: 'l', at: 0 }, { name: 'r', at: r }] : [], window: r >= 0 ? [0, r] : undefined })])
  while (l <= r) { // [2] something is still live: look at its middle
    const m = l + Math.floor((r - l) / 2)
    t.step(2, `The middle is index ${m} and holds ${nums[m]}. Compare it with ${target}.`, [arr(nums, { label: 'sorted nums', tones: nums.map((_, i) => (i < l || i > r ? 'dim' : i === m ? 'focus' : null)), pointers: [{ name: 'l', at: l }, { name: 'm', at: m, tone: 'focus' }, { name: 'r', at: r }], window: [l, r] })])
    if (nums[m] === target) { // [4] found it: that is the answer
      t.step(4, `${nums[m]} equals ${target}. Answer: index ${m}.`, [arr(nums, { label: 'sorted nums', tones: nums.map((_, i) => (i === m ? 'hit' : 'dim')), pointers: [{ name: 'm', at: m, tone: 'hit' }] })])
      return m
    }
    if (nums[m] < target) l = m + 1 // [3] middle is too small: drop it and everything left of it
    else r = m - 1 // [3] middle is too big: drop it and everything right of it
    t.step(3, nums[m] < target ? `${nums[m]} is smaller than ${target}, so the target can only be to the right. Drop the left half.` : `${nums[m]} is bigger than ${target}, so the target can only be to the left. Drop the right half.`, [arr(nums, { label: 'sorted nums', tones: nums.map((_, i) => (i < l || i > r ? 'dim' : null)), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }].filter((p) => p.at >= 0 && p.at < nums.length), window: l <= r ? [l, r] : undefined })])
  }
  t.step(4, `l (${l}) has passed r (${r}). Nothing is left to check, so ${target} is not in the array.`, [arr(nums, { label: 'sorted nums', tones: nums.map(() => 'miss' as const) })])
  return -1 // [4] the live range is empty: not found
}
