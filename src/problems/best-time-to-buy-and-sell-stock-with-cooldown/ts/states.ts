import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function maxProfit(prices: number[], t: Tracer = noop): number {
  const n = prices.length
  if (n === 0) return 0
  const hold = Array<number>(n).fill(0) // [1] hold[i]: best profit at the end of day i while owning a share
  const sold = Array<number>(n).fill(0) // [1] sold[i]: best profit if I sold on day i
  const rest = Array<number>(n).fill(0) // [1] rest[i]: best profit owning nothing, and I did not sell on day i
  hold[0] = -prices[0] // [1] day 0: the only way to hold is to buy now. Selling is impossible, so sold and rest stay 0
  t.step(1, `Day 0, price ${prices[0]}. To hold a share I must buy it now: hold = -${prices[0]}. Nothing can be sold yet, so sold and rest are 0.`, [view(prices, hold, sold, rest, 0, 3, [[0, 0, 'focus'], [1, 0, 'keep'], [2, 0, 'keep']])])
  for (let i = 1; i < n; i++) {
    hold[i] = Math.max(hold[i - 1], rest[i - 1] - prices[i]) // [2] keep holding, or buy today (only allowed after a rest day)
    t.step(2, `Day ${i}, price ${prices[i]}. hold = max(keep holding ${hold[i - 1]}, buy after resting ${rest[i - 1]} - ${prices[i]}) = ${hold[i]}.`, [view(prices, hold, sold, rest, i, 1, [[0, i - 1, 'keep'], [2, i - 1, 'keep'], [0, i, 'focus']])])
    sold[i] = hold[i - 1] + prices[i] // [3] sell the share I was holding yesterday
    t.step(3, `sold = yesterday's hold ${hold[i - 1]} + today's price ${prices[i]} = ${sold[i]}. Selling forces a cooldown tomorrow.`, [view(prices, hold, sold, rest, i, 2, [[0, i - 1, 'keep'], [1, i, 'focus']])])
    rest[i] = Math.max(rest[i - 1], sold[i - 1]) // [4] do nothing: stay resting, or finish yesterday's cooldown
    t.step(4, `rest = max(rested yesterday ${rest[i - 1]}, sold yesterday ${sold[i - 1]}) = ${rest[i]}. Yesterday's sale becomes a rest day, so buying is allowed again tomorrow.`, [view(prices, hold, sold, rest, i, 3, [[2, i - 1, 'keep'], [1, i - 1, 'keep'], [2, i, 'focus']])])
  }
  const best = Math.max(sold[n - 1], rest[n - 1])
  t.step(5, `Last day. End without a share: max(sold ${sold[n - 1]}, rest ${rest[n - 1]}) = ${best}. Holding at the end is never better.`, [view(prices, hold, sold, rest, n - 1, 3, [[1, n - 1, best === sold[n - 1] ? 'hit' : 'keep'], [2, n - 1, best === rest[n - 1] ? 'hit' : 'keep']])])
  return best // [5] finish owning nothing: sold on the last day or resting
}
