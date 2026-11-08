import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function maxProfit(prices: number[], t: Tracer = noop): number {
  let buy = 0 // [1] index of the cheapest day seen so far
  let best = 0 // [1] best profit seen so far
  t.step(1, prices.length === 0 ? 'No prices, so no trade. The answer is 0.' : `Start with day 0 as the buy day. Best profit so far is 0.`, [arr(prices, { label: 'price per day', tones: prices.map((_, k) => (k === 0 ? 'keep' : null)), pointers: prices.length ? [{ name: 'buy', at: 0, tone: 'keep' }] : [] })])
  for (let sell = 1; sell < prices.length; sell++) {
    if (prices[sell] < prices[buy]) { // [2] a cheaper day: buying here beats every earlier day
      buy = sell
      t.step(2, `Day ${sell} costs ${prices[sell]}, cheaper than before. Move the buy day here.`, [arr(prices, { label: 'price per day', tones: prices.map((_, k) => (k === buy ? 'keep' : k < buy ? 'dim' : null)), pointers: [{ name: 'buy', at: buy, tone: 'keep' }], window: [buy, sell] })])
      continue
    }
    best = Math.max(best, prices[sell] - prices[buy]) // [3] sell today: profit against the cheapest day so far
    t.step(3, `Sell on day ${sell} at ${prices[sell]}, bought at ${prices[buy]}. Profit ${prices[sell] - prices[buy]}. Best is now ${best}.`, [arr(prices, { label: 'price per day', tones: prices.map((_, k) => (k === buy ? 'keep' : k === sell ? 'focus' : k < sell ? 'dim' : null)), pointers: [{ name: 'buy', at: buy, tone: 'keep' }, { name: 'sell', at: sell, tone: 'focus' }], window: [buy, sell] })])
  }
  t.step(4, `Every day was tried as the sell day. The best profit is ${best}.`, [arr(prices, { label: 'price per day', tones: prices.map(() => 'dim' as const) })])
  return best // [4] 0 when prices only fall
}
