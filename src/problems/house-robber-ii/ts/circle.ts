import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { street, view } from './viz'

export function robCircle(nums: number[], t: Tracer = noop): number {
  const n = nums.length
  if (n === 1) return nums[0] // [1] one house has no neighbour
  t.step(1, `The first and last houses are neighbours, so they cannot both be robbed. Either skip the last house or skip the first, solve each straight row, and keep the better.`, [arr(nums, { label: 'houses in a circle (first and last touch)' })])
  const skipLast = robLine(nums, 0, n - 1, t) // [2] the row without the last house
  t.step(2, `Without the last house (houses 0 to ${n - 2}) the best is ${skipLast}.`, [street(nums, 0, n - 1, { [n - 1]: 'miss' })])
  const skipFirst = robLine(nums, 1, n, t) // [3] the row without the first house
  t.step(3, `Without the first house (houses 1 to ${n - 1}) the best is ${skipFirst}.`, [street(nums, 1, n, { 0: 'miss' })])
  t.step(6, `The better of the two rows: max(${skipLast}, ${skipFirst}) = ${Math.max(skipLast, skipFirst)}.`, [arr(nums, { label: 'houses in a circle (first and last touch)' })])
  return Math.max(skipLast, skipFirst) // [6] the better of the two rows
}

// House Robber on the straight row nums[lo..hi-1]
function robLine(nums: number[], lo: number, hi: number, t: Tracer = noop): number {
  const m = hi - lo
  const dp = new Array<number>(m + 1).fill(0) // [4] dp[k] = most loot from the first k houses of the row
  dp[1] = nums[lo] // [4] one house: take it
  t.step(4, `Row of houses ${lo} to ${hi - 1}. dp[k] = most loot from its first k houses. dp[0] = 0 and dp[1] = ${nums[lo]}.`, [street(nums, lo, hi, { [lo]: 'keep' }), view(dp, 2, { 0: 'keep', 1: 'keep' })])
  for (let k = 2; k <= m; k++) {
    const skip = dp[k - 1] // [5] skip the k-th house of the row
    const take = dp[k - 2] + nums[lo + k - 1] // [5] rob it, so build on dp[k-2]
    dp[k] = Math.max(skip, take) // [5] the better of the two choices
    t.step(5, `dp[${k}] = max(dp[${k - 1}], dp[${k - 2}] + nums[${lo + k - 1}]) = max(${skip}, ${dp[k - 2]} + ${nums[lo + k - 1]}) = max(${skip}, ${take}) = ${dp[k]}.`, [street(nums, lo, hi, { [lo + k - 1]: 'focus' }), view(dp, k + 1, { [k - 1]: 'keep', [k - 2]: 'keep', [k]: 'focus' })])
  }
  return dp[m]
}
