import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { fmt, options, view } from './viz'

export function coinChange(coins: number[], amount: number, t: Tracer = noop): number {
  const dp: number[] = new Array(amount + 1).fill(Infinity) // [1] fewest coins for each amount, none known yet
  dp[0] = 0
  t.step(1, `dp[0] = 0: zero coins make amount 0. Every other amount starts as inf (not reachable yet). Coins: ${coins.join(', ')}.`, view(coins, dp, 0))
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1) // [2] use coin c last, plus the best way to make the rest
    }
    t.step(2, `Amount ${a}: ${options(coins, dp, a)}. Smallest gives dp[${a}] = ${fmt(dp[a])}.`, view(coins, dp, a))
  }
  t.step(3, dp[amount] === Infinity ? `dp[${amount}] is still inf, so no mix of these coins makes ${amount}. Answer: -1.` : `dp[${amount}] = ${dp[amount]}, so ${amount} needs ${dp[amount]} coins at the fewest.`, view(coins, dp, amount, true))
  return dp[amount] === Infinity ? -1 : dp[amount] // [3] inf means impossible
}
