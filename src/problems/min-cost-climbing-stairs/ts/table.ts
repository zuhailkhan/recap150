import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, mark } from '../../../core/panels'
import { view } from './viz'

export function minCostClimbingStairs(cost: number[], t: Tracer = noop): number {
  const n = cost.length
  const dp = new Array<number>(n + 1).fill(0) // [1] dp[i] = cheapest total paid to stand on step i. The top is step n
  // [1] the first two cells stay 0: you may start on step 0 or step 1 for free
  t.step(1, `dp[i] = cheapest total paid to stand on step i. Starting on step 0 or 1 is free, so dp[0] = dp[1] = 0. The top is step ${n}, one past the last fee.`, [arr(cost, { label: 'cost[i] = fee to leave step i' }), view(dp, 2, { 0: 'keep', 1: 'keep' }, 'dp[i] = cheapest way to stand on step i')])
  for (let i = 2; i <= n; i++) {
    const fromOne = dp[i - 1] + cost[i - 1] // [2] arrive by a 1-step: pay to leave step i-1
    const fromTwo = dp[i - 2] + cost[i - 2] // [2] arrive by a 2-step: pay to leave step i-2
    dp[i] = Math.min(fromOne, fromTwo) // [2] take the cheaper way in
    t.step(2, `dp[${i}] = min(dp[${i - 1}] + cost[${i - 1}], dp[${i - 2}] + cost[${i - 2}]) = min(${dp[i - 1]} + ${cost[i - 1]}, ${dp[i - 2]} + ${cost[i - 2]}) = min(${fromOne}, ${fromTwo}) = ${dp[i]}`, [arr(cost, { label: 'cost[i] = fee to leave step i', tones: mark(n, { [i - 1]: 'keep', [i - 2]: 'keep' }) }), view(dp, i + 1, { [i - 1]: 'keep', [i - 2]: 'keep', [i]: 'focus' }, 'dp[i] = cheapest way to stand on step i')])
  }
  t.step(3, `The top is step ${n}, so the answer is dp[${n}] = ${dp[n]}.`, [arr(cost, { label: 'cost[i] = fee to leave step i' }), view(dp, n + 1, { [n]: 'hit' }, 'dp[i] = cheapest way to stand on step i')])
  return dp[n] // [3] the top is one past the last step
}
