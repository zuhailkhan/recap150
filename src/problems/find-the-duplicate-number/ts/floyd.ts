import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

export function findDuplicate(nums: number[], t: Tracer = noop): number {
  let slow = 0 // [1] treat each index as a node: i points to nums[i]. Start at index 0
  let fast = 0 // [1]
  t.step(1, 'Read nums as pointers: index i points at nums[i]. Both walkers start at index 0.', show(nums, slow, fast))
  do {
    slow = nums[slow] // [2] slow takes one step
    fast = nums[nums[fast]] // [2] fast takes two
    t.step(2, slow === fast ? `slow and fast are both on ${slow}. They met inside the loop.` : `slow steps to ${slow}. fast jumps two steps to ${fast}.`, show(nums, slow, fast))
  } while (slow !== fast)
  slow = 0 // [3] restart slow at the beginning. fast stays where they met
  t.step(3, `Put slow back at index 0. fast stays on ${fast}. Now both move one step at a time.`, show(nums, slow, fast))
  while (slow !== fast) {
    slow = nums[slow] // [3] the two walkers now meet exactly where the loop starts
    fast = nums[fast]
    t.step(3, slow === fast ? `Both land on ${slow}. This is the loop entrance.` : `slow steps to ${slow}. fast steps to ${fast}.`, show(nums, slow, fast))
  }
  t.step(4, `${slow} is the first index that two different indexes point to. That is the duplicate.`, show(nums, slow, fast, true))
  return slow // [4] the loop entrance is the duplicate value
}
