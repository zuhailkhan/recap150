import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, mark } from '../../../core/panels'
import { view } from './viz'

export function rob(nums: number[], t: Tracer = noop): number {
  const n = nums.length
  if (n === 0) return 0
  const dp = new Array<number>(n + 1).fill(0) // [1] dp[i] = most loot from the first i houses. zero houses is worth 0
  dp[1] = nums[0] // [1] with one house, take it
  t.step(1, `dp[i] = most loot from the first i houses. With 0 houses that is 0, with 1 house it is ${nums[0]}. Fill left to right up to ${n} houses.`, [arr(nums, { label: 'nums (house loot)', tones: mark(n, { 0: 'keep' }) }), view(dp, 2, { 0: 'keep', 1: 'keep' }, 'dp[i] = most loot from the first i houses')])
  for (let i = 2; i <= n; i++) {
    const skip = dp[i - 1] // [2] skip house i: keep the best of the first i-1 houses
    const take = dp[i - 2] + nums[i - 1] // [2] rob house i: its neighbour is off limits, so build on dp[i-2]
    dp[i] = Math.max(skip, take) // [2] the better of the two choices
    t.step(2, `dp[${i}] = max(dp[${i - 1}], dp[${i - 2}] + nums[${i - 1}]) = max(${skip}, ${dp[i - 2]} + ${nums[i - 1]}) = max(${skip}, ${take}) = ${dp[i]}. ${take > skip ? `Rob house ${i}.` : `Skip house ${i}.`}`, [arr(nums, { label: 'nums (house loot)', tones: mark(n, { [i - 1]: 'focus' }) }), view(dp, i + 1, { [i - 1]: 'keep', [i - 2]: 'keep', [i]: 'focus' }, 'dp[i] = most loot from the first i houses')])
  }
  t.step(3, `All ${n} houses are covered, so the answer is dp[${n}] = ${dp[n]}.`, [arr(nums, { label: 'nums (house loot)' }), view(dp, n + 1, { [n]: 'hit' }, 'dp[i] = most loot from the first i houses')])
  return dp[n] // [3] the best over all n houses
}
