// Trace-only drawing helpers. Never shown on the page.
import { arr, dp as dpPanel, mark, type Panel, type Tone } from '../../../core/panels'

/** The digits, with the ones being read in focus, and the dp row. Cells past `upTo` are not filled yet. */
export function view(s: string, dp: number[], upTo: number, digits: number[], reads: number[], answer = false): Panel[] {
  const dig: Record<number, Tone> = {}
  for (const k of digits) dig[k] = 'focus'
  const cell: Record<number, Tone> = {}
  for (const k of reads) cell[k] = 'keep'
  cell[upTo] = answer ? 'hit' : 'focus'
  return [
    arr([...s], { label: 's (digits)', tones: mark(s.length, dig) }),
    dpPanel([dp.map((v, k) => (k <= upTo ? v : ''))], { label: 'dp[i] = ways to read the first i digits', colLabels: dp.map((_, k) => k), tones: [mark(dp.length, cell)] }),
  ]
}
