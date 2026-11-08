import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { view } from './viz'

export function canPartition(nums: number[], t: Tracer = noop): boolean {
  const total = nums.reduce((a, b) => a + b, 0)
  t.step(1, total % 2 === 1 ? `The numbers add up to ${total}, which is odd. Two equal halves are impossible, so the answer is false.` : `The numbers add up to ${total}. Two equal halves need ${total / 2} each, so look for a subset that adds up to ${total / 2}.`, [arr(nums, { label: `numbers (total ${total})` })])
  if (total % 2 === 1) return false // [1] an odd total cannot split into two equal halves
  const target = total / 2
  const dp: boolean[] = new Array(target + 1).fill(false) // [2] dp[s] = some of the numbers so far add up to s
  dp[0] = true // [2] the empty subset adds up to 0
  t.step(2, `dp has ${target + 1} cells, for sums 0 to ${target}. Only dp[0] is true: the empty subset adds up to 0.`, view(nums, dp, 0, { 0: 'keep' }))
  for (let k = 0; k < nums.length; k++) {
    const x = nums[k]
    t.step(3, x > target ? `Number ${x} is bigger than ${target}, so it can never be used. The sweep is empty.` : `Number ${x}. Sweep s from ${target} down to ${x}. Going downward keeps dp[s - ${x}] describing only the numbers before ${x}, so ${x} is used at most once.`, view(nums, dp, k))
    for (let s = target; s >= x; s--) { // [3] sweep backwards so each number is used once
      if (!dp[s] && dp[s - x]) { // [4] s - x was reachable without x, so adding x reaches s
        dp[s] = true
        t.step(4, `Sum ${s}: dp[${s - x}] is true, so adding ${x} reaches ${s}. dp[${s}] = true.`, view(nums, dp, k, { [s - x]: 'keep', [s]: 'focus' }))
      }
    }
  }
  t.step(5, dp[target] ? `dp[${target}] is true: some numbers add up to ${target}, and the rest add up to ${target} too. Answer: true.` : `dp[${target}] is false: no subset adds up to ${target}. Answer: false.`, view(nums, dp, nums.length, { [target]: dp[target] ? 'hit' : 'miss' }))
  return dp[target] // [5] can some subset reach half the total?
}
