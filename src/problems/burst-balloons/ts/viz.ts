// Trace-only helpers for the DP table. Never shown on the page.
import type { Cell } from '../../../core/panels'

/**
 * The table so far. Only cells with l < r are used. Neighbours (r = l + 1) are 0 from the start.
 * Ranges shorter than `gap` are done, and so are cells of this gap with l <= curL. Everything else shows ''.
 */
export const shown = (dp: number[][], gap: number, curL: number): Cell[][] =>
  dp.map((row, l) => row.map((v, r) => (r - l === 1 ? 0 : r - l >= 2 && (r - l < gap || (r - l === gap && l <= curL)) ? v : '')))

/** Header labels such as "1:3" = position 1 holds a balloon worth 3. */
export const labels = (a: number[]): string[] => a.map((v, i) => `${i}:${v}`)

/** Plain-words meaning of one cell, used as the panel label. */
export const title = (): string => 'dp[l][r] = most coins from bursting every balloon strictly between l and r (l and r stay)'
