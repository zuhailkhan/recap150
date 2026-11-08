import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, bits, cursor } from '../../../core/panels'
import { diff, lit, wd } from './viz'

export function missingNumber(nums: number[], t: Tracer = noop): number {
  let x = nums.length // [1] start with n: the index that no position carries
  t.step(1, `The list has ${nums.length} numbers, so the range is 0..${nums.length}. Start x at ${x}, the one index with no slot.`, [arr(nums, { label: 'nums' }), bits([{ label: 'x', value: x }], { width: wd(...nums, nums.length) })])
  for (let i = 0; i < nums.length; i++) {
    x ^= i ^ nums[i] // [2] XOR in the index and the value. Each number met twice cancels
    t.step(2, `XOR in index ${i} and value ${nums[i]}. If they are equal they cancel. x is now ${x}.`, [arr(nums, { label: 'nums', tones: cursor(nums.length, i), pointers: [{ name: 'i', at: i }] }), bits([{ label: 'idx', value: i }, { label: 'val', value: nums[i] }, { label: 'x', value: x, tones: diff(wd(...nums, nums.length), x ^ i ^ nums[i], x, 'focus') }], { width: wd(...nums, nums.length) })])
  }
  t.step(3, `Every number from 0 to ${nums.length} met itself once as an index and once as a value, except the missing one. x = ${x}.`, [arr(nums, { label: 'nums', tones: nums.map(() => 'dim') }), bits([{ label: 'x', value: x, tones: lit(wd(...nums, nums.length), x, 'hit') }], { width: wd(...nums, nums.length) })])
  return x // [3] the only value that never cancelled
}
