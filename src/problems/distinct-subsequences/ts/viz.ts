// Trace-only helpers for the DP table. Never shown on the page.
import type { Cell } from '../../../core/panels'

/** The table so far: row 0, column 0 and every cell up to (r, c) in reading order show their value, the rest show '' (not computed yet). */
export const shown = (dp: number[][], r: number, c: number): Cell[][] =>
  dp.map((row, i) => row.map((v, j) => (i === 0 || j === 0 || i < r || (i === r && j <= c) ? v : '')))

/** Header labels: the empty prefix first, then one label per letter. */
export const labels = (w: string): string[] => ['', ...w]

/** Plain-words meaning of one cell, used as the panel label. */
export const title = (s: string, target: string): string =>
  `dp[i][j] = number of ways to pick letters from the first i letters of "${s}" (rows) that spell the first j letters of "${target}" (columns)`
