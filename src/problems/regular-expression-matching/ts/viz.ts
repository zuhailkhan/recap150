// Trace-only helpers for the DP table. Never shown on the page.
import type { Cell } from '../../../core/panels'

const tf = (b: boolean): string => (b ? 'T' : 'F')

/** The table so far: row 0, column 0 and every cell up to (r, c) in reading order show T or F, the rest show '' (not computed yet). */
export const shown = (dp: boolean[][], r: number, c: number): Cell[][] =>
  dp.map((row, i) => row.map((v, j) => (i === 0 || j === 0 || i < r || (i === r && j <= c) ? tf(v) : '')))

/** Header labels: the empty prefix first, then one label per symbol. */
export const labels = (w: string): string[] => ['', ...w]

/** Plain-words meaning of one cell, used as the panel label. */
export const title = (s: string, p: string): string =>
  `dp[i][j] = T when the first i letters of "${s}" (rows) match the first j symbols of the pattern "${p}" (columns)`

export const tfs = tf
