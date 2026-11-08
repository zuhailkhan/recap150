// Trace-only helpers. Not shown on the page.
import { dp, mark2, type Tone } from '../../../core/panels'

/** States by day. Cells after (day, k) in fill order are blank. k = how many of hold, sold, rest are filled on that day. */
export function view(prices: number[], hold: number[], sold: number[], rest: number[], day: number, k: number, set: [number, number, Tone][] = []) {
  const rows = [hold, sold, rest]
  const cells = rows.map((row, r) => row.map((v, c) => (c < day || (c === day && r < k) ? v : '')))
  return dp(cells, {
    label: 'dp[state][day] = best profit at the end of that day. hold: you own a share. sold: you sold today. rest: you own nothing and did not sell today.',
    rowLabels: ['hold', 'sold', 'rest'],
    colLabels: prices.map((p, i) => `d${i}: ${p}`),
    tones: mark2(3, prices.length, set),
  })
}
