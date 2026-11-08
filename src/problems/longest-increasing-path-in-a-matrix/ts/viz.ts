// Trace-only helpers. Never shown on the page.
import type { Cell, Tone, Tones } from '../../../core/panels'
import { mark2 } from '../../../core/panels'

/** The strictly bigger neighbours of (r, c): the only cells a path can step to. */
export const uphill = (m: number[][], r: number, c: number): [number, number][] =>
  ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
    .map(([dr, dc]): [number, number] => [r + dr, c + dc])
    .filter(([a, b]) => a >= 0 && a < m.length && b >= 0 && b < m[0].length && m[a][b] > m[r][c])

/** Memo for the picture: 0 means not computed yet, so it is drawn empty. */
export const memoView = (memo: number[][]): Cell[][] => memo.map((row) => row.map((v) => (v === 0 ? '' : v)))

/** Tones for the cells in `cells` plus a focus cell. */
export const tones = (rows: number, cols: number, cells: [number, number][], tone: Tone, at: [number, number]): Tones[] =>
  mark2(rows, cols, [...cells.map(([r, c]): [number, number, Tone] => [r, c, tone]), [at[0], at[1], 'focus']])

/** Cells whose memo equals the best length, for the final highlight. */
export const bestCells = (memo: number[][], best: number): [number, number][] =>
  memo.flatMap((row, r) => row.flatMap((v, c): [number, number][] => (v === best ? [[r, c]] : [])))
