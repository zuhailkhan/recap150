// Trace-only helpers. Not shown on the page.
import { dp, mark2, type Tone } from '../../../core/panels'

/** The table so far. Interior cells after (i, j) in fill order are blank. */
export function view(table: number[][], a: string, b: string, i: number, j: number, set: [number, number, Tone][] = []) {
  const cells = table.map((row, r) => row.map((v, c) => (r >= 1 && c >= 1 && (r > i || (r === i && c > j)) ? '' : v)))
  return dp(cells, {
    label: 'dp[i][j] = longest common subsequence of the first i letters of text1 (rows) and the first j letters of text2 (columns)',
    rowLabels: ['', ...a],
    colLabels: ['', ...b],
    tones: mark2(table.length, table[0].length, set),
  })
}

/** Tones for the zero row and zero column. */
export function edge(m: number, n: number): [number, number, Tone][] {
  const out: [number, number, Tone][] = []
  for (let r = 0; r <= m; r++) out.push([r, 0, 'keep'])
  for (let c = 1; c <= n; c++) out.push([0, c, 'keep'])
  return out
}
