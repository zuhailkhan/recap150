import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { edge, view } from './viz'

export function change(amount: number, coins: number[], t: Tracer = noop): number {
  const k = coins.length
  const dp = Array.from({ length: k + 1 }, () => Array<number>(amount + 1).fill(0)) // [1] row i: only the first i kinds of coin may be used
  for (let i = 0; i <= k; i++) dp[i][0] = 1 // [1] amount 0 has exactly one way: take no coins at all
  t.step(1, `Rows say which coins are allowed: none, then ${coins.map((_, r) => `{${coins.slice(0, r + 1).join(',')}}`).join(', ')}. Amount 0 has 1 way (take nothing). With no coins every other amount has 0 ways.`, [view(dp, coins, 0, 0, edge(k, amount))])
  for (let i = 1; i <= k; i++) { // coins in the OUTER loop: each combination is built in one fixed coin order
    const c = coins[i - 1]
    for (let a = 1; a <= amount; a++) {
      dp[i][a] = dp[i - 1][a] // [2] never use coin c: same ways as with the earlier coins
      if (a >= c) dp[i][a] += dp[i][a - c] // [3] use coin c at least once: take one, then make a - c with the same coins
      t.step(a >= c ? 3 : 2, a >= c ? `dp[${i}][${a}] = without coin ${c} (above ${dp[i - 1][a]}) + with coin ${c} (left, dp[${i}][${a - c}] = ${dp[i][a - c]}) = ${dp[i][a]}.` : `Coin ${c} is bigger than ${a}, so it cannot be used. dp[${i}][${a}] = above ${dp[i - 1][a]}.`, [view(dp, coins, i, a, a >= c ? [[i - 1, a, 'keep'], [i, a - c, 'keep'], [i, a, 'focus']] : [[i - 1, a, 'keep'], [i, a, 'focus']])])
    }
  }
  t.step(4, `Table full. The bottom-right cell uses every coin kind: ${dp[k][amount]} combinations make ${amount}.`, [view(dp, coins, k, amount, [[k, amount, 'hit']])])
  return dp[k][amount] // [4] all coins allowed, full amount
}
