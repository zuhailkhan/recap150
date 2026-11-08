import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function search(nums: number[], target: number, t: Tracer = noop): number {
  let l = 0 // [1] the live range is nums[l..r]
  let r = nums.length - 1 // [1]
  t.step(1, `Looking for ${target} in a rotated array. The live range is the whole array, index 0 to ${r}.`, [arr(nums, { label: 'rotated nums', pointers: r >= 0 ? [{ name: 'l', at: 0 }, { name: 'r', at: r }] : [], window: r >= 0 ? [0, r] : undefined })])
  while (l <= r) { // [2] something is still live: look at its middle
    const m = l + Math.floor((r - l) / 2)
    t.step(2, `The middle is index ${m}, holding ${nums[m]}. Compare it with ${target}.`, [arr(nums, { label: 'rotated nums', tones: nums.map((_, i) => (i < l || i > r ? 'dim' : i === m ? 'focus' : null)), pointers: [{ name: 'l', at: l }, { name: 'm', at: m, tone: 'focus' }, { name: 'r', at: r }], window: [l, r] })])
    if (nums[m] === target) { // [5] found it: that is the answer
      t.step(5, `${nums[m]} is the target. Answer: index ${m}.`, [arr(nums, { label: 'rotated nums', tones: nums.map((_, i) => (i === m ? 'hit' : 'dim')), pointers: [{ name: 'm', at: m, tone: 'hit' }] })])
      return m
    }
    const leftSorted = nums[l] <= nums[m] // [3] one side of m is always in order: which one?
    t.step(3, leftSorted ? `${nums[l]} <= ${nums[m]}, so indexes ${l} to ${m} are in order. Check whether ${target} fits inside them.` : `${nums[l]} > ${nums[m]}, so the drop is on the left. Indexes ${m} to ${r} are in order. Check whether ${target} fits inside them.`, [arr(nums, { label: 'rotated nums (marked: the side that is in order)', tones: nums.map((_, i) => (i < l || i > r ? 'dim' : i === m ? 'focus' : (leftSorted ? i < m : i > m) ? 'keep' : null)), pointers: [{ name: 'l', at: l }, { name: 'm', at: m, tone: 'focus' }, { name: 'r', at: r }], window: [l, r] })])
    let goLeft: boolean // [4] does the target lie left of m?
    if (leftSorted) goLeft = nums[l] <= target && target < nums[m] // [4] left side is ordered: is the target inside it?
    else goLeft = !(nums[m] < target && target <= nums[r]) // [4] right side is ordered: if the target is not inside it, go left
    if (goLeft) r = m - 1 // [4] drop the middle and everything right of it
    else l = m + 1 // [4] drop the middle and everything left of it
    t.step(4, `${target} ${leftSorted === goLeft ? 'fits inside' : 'does not fit inside'} the ordered side, so it must be ${goLeft ? 'left' : 'right'} of index ${m}. Drop the other half.`, [arr(nums, { label: 'rotated nums', tones: nums.map((_, i) => (i < l || i > r ? 'dim' : null)), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }].filter((p) => p.at >= 0 && p.at < nums.length), window: l <= r ? [l, r] : undefined })])
  }
  t.step(5, `l (${l}) has passed r (${r}). Nothing is left, so ${target} is not in the array.`, [arr(nums, { label: 'rotated nums', tones: nums.map(() => 'miss' as const) })])
  return -1 // [5] the live range is empty: not found
}
