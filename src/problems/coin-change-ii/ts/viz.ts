// Trace-only helpers. Not shown on the page.
import { dp, mark2, type Tone } from '../../../core/panels'

/** The table so far. Interior cells after (i, a) in fill order are blank. */
export function view(table: number[][], coins: number[], i: number, a: number, set: [number, number, Tone][] = []) {
  const cells = table.map((row, r) => row.map((v, c) => (r >= 1 && c >= 1 && (r > i || (r === i && c > a)) ? '' : v)))
  return dp(cells, {
    label: 'dp[i][a] = number of combinations that make amount a using only the first i kinds of coin (rows)',
    rowLabels: table.map((_, r) => (r === 0 ? 'none' : `{${coins.slice(0, r).join(',')}}`)),
    colLabels: table[0].map((_, c) => `a=${c}`),
    tones: mark2(table.length, table[0].length, set),
  })
}

/** Tones for the base row and base column. */
export function edge(k: number, amount: number): [number, number, Tone][] {
  const out: [number, number, Tone][] = []
  for (let r = 0; r <= k; r++) out.push([r, 0, 'keep'])
  for (let c = 1; c <= amount; c++) out.push([0, c, 'keep'])
  return out
}
