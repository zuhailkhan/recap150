import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function climbStairs(n: number, t: Tracer = noop): number {
  const dp = new Array<number>(n + 1).fill(0) // [1] dp[i] = ways to reach step i. n + 1 cells: step 0 is the ground
  dp[0] = 1 // [1] one way to stand on the ground: do nothing
  dp[1] = 1 // [1] one way to reach step 1: a single 1-step
  t.step(1, `dp[i] = ways to reach step i. The ground has 1 way (do nothing) and step 1 has 1 way. Fill the rest left to right up to step ${n}.`, [view(dp, 2, { 0: 'keep', 1: 'keep' }, 'dp[i] = ways to reach step i')])
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2] // [2] the last move was a 1-step (from i-1) or a 2-step (from i-2)
    t.step(2, `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}. The last move was a 1-step from step ${i - 1} or a 2-step from step ${i - 2}.`, [view(dp, i + 1, { [i - 1]: 'keep', [i - 2]: 'keep', [i]: 'focus' }, 'dp[i] = ways to reach step i')])
  }
  t.step(3, `The top is step ${n}, so the answer is dp[${n}] = ${dp[n]}.`, [view(dp, n + 1, { [n]: 'hit' }, 'dp[i] = ways to reach step i')])
  return dp[n] // [3] the top step is the last cell
}
