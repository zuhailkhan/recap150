import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { readout, view } from './viz'

export function lengthOfLIS(nums: number[], t: Tracer = noop): number {
  const n = nums.length
  const dp: number[] = new Array(n).fill(1) // [1] every number alone is an increasing run of length 1
  t.step(1, 'Every number alone is a run of length 1, so dp starts as all 1s. Fill it left to right.', view(nums, dp, 0, false))
  for (let i = 1; i < n; i++) {
    t.step(2, readout(nums, dp, i) ? `Number ${nums[i]} at index ${i}. Earlier numbers smaller than ${nums[i]} (blue) can come just before it: ${readout(nums, dp, i)}.` : `Number ${nums[i]} at index ${i}. No earlier number is smaller (all red), so nothing can come before it.`, view(nums, dp, i, true))
    for (let j = 0; j < i; j++) { // [2] look back at every earlier number
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1) // [3] strictly smaller: extend its run by one
    }
    t.step(3, readout(nums, dp, i) ? `dp[${i}] = 1 + the biggest of ${readout(nums, dp, i)}, which is ${dp[i]}.` : `dp[${i}] stays 1: the number starts a new run.`, view(nums, dp, i, true))
  }
  const best = Math.max(0, ...dp) // [4] the best run can end at any index
  t.step(4, `The run can end anywhere, so the answer is the biggest cell in dp: ${best}.`, view(nums, dp, n - 1, false, dp.indexOf(best)))
  return best
}
