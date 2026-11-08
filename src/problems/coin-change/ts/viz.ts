// Trace-only drawing helpers. Never shown on the page. Infinity never goes into a panel: it is drawn as "inf".
import { dp as dpPanel, mark, type Panel, type Tone } from '../../../core/panels'

export const fmt = (v: number): string | number => (v === Infinity ? 'inf' : v)

/** The coins that fit, each with the cell it reads and what it would give. */
export const options = (coins: number[], dp: number[], a: number): string =>
  coins.filter((c) => c <= a).map((c) => `coin ${c} reads dp[${a - c}] and gives ${fmt(dp[a - c] + 1)}`).join('; ') || `no coin fits in ${a}`

/** The whole table. Cell a is in focus, the cells it reads are keep, unreachable ones are miss. */
export function view(coins: number[], dp: number[], a: number, answer = false): Panel[] {
  const set: Record<number, Tone> = {}
  for (const c of coins) if (c <= a) set[a - c] = dp[a - c] === Infinity ? 'miss' : 'keep'
  set[a] = answer ? (dp[a] === Infinity ? 'miss' : 'hit') : dp[a] === Infinity && a > 0 ? 'miss' : 'focus'
  return [dpPanel([dp.map(fmt)], { label: 'dp[a] = fewest coins to make amount a (inf = cannot)', colLabels: dp.map((_, k) => k), tones: [mark(dp.length, set)] })]
}
