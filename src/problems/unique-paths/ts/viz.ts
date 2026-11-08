// Trace-only helpers. Not shown on the page.
import { dp, mark2, type Tone } from '../../../core/panels'

/** The table so far. Interior squares after (i, j) in fill order are blank. */
export function view(table: number[][], i: number, j: number, set: [number, number, Tone][] = []) {
  const m = table.length
  const n = table[0].length
  const cells = table.map((row, r) => row.map((v, c) => (r >= 1 && c >= 1 && (r > i || (r === i && c > j)) ? '' : v)))
  return dp(cells, {
    label: 'dp[i][j] = number of ways to reach this square from the top-left',
    rowLabels: table.map((_, r) => `i=${r}`),
    colLabels: table[0].map((_, c) => `j=${c}`),
    tones: mark2(m, n, set),
  })
}

/** Tones for the first row and column. */
export function edge(m: number, n: number): [number, number, Tone][] {
  const out: [number, number, Tone][] = []
  for (let r = 0; r < m; r++) out.push([r, 0, 'keep'])
  for (let c = 1; c < n; c++) out.push([0, c, 'keep'])
  return out
}
