import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, bits, cursor } from '../../../core/panels'
import { diff, lit, wd } from './viz'

export function singleNumber(nums: number[], t: Tracer = noop): number {
  let x = 0 // [1] running XOR. XOR with 0 changes nothing, so 0 is a safe start
  t.step(1, 'Start with x = 0. XOR with 0 changes nothing. Every number will be folded into x.', [arr(nums, { label: 'nums' }), bits([{ label: 'x', value: 0 }], { width: wd(...nums) })])
  for (let i = 0; i < nums.length; i++) {
    x ^= nums[i] // [2] fold the number in. A number seen twice cancels itself
    t.step(2, `x was ${x ^ nums[i]}. XOR with ${nums[i]} flips the bits where ${nums[i]} has a 1. x is now ${x}.`, [arr(nums, { label: 'nums', tones: cursor(nums.length, i), pointers: [{ name: 'i', at: i }] }), bits([{ label: 'x', value: x ^ nums[i] }, { label: 'n', value: nums[i], tones: lit(wd(...nums), nums[i], 'focus') }, { label: 'x^n', value: x, tones: diff(wd(...nums), x ^ nums[i], x, 'hit') }], { width: wd(...nums) })])
  }
  t.step(3, `Every pair has cancelled. What is left in x is ${x}, the number that has no twin.`, [arr(nums, { label: 'nums', tones: nums.map((n) => (n === x ? 'hit' : 'dim')) }), bits([{ label: 'x', value: x, tones: lit(wd(...nums), x, 'hit') }], { width: wd(...nums) })])
  return x // [3] only the unpaired number survives
}
