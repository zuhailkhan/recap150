import { dp, mark, type Panel, type Tone } from '../../../core/panels'

/** One-row DP table. Cells that are not filled yet show "?". `set` colours cells by index. */
export const view = (vals: number[], filled: number, set: Record<number, Tone>, label: string): Panel =>
  dp([vals.map((v, i) => (i < filled ? v : '?'))], { label, colLabels: vals.map((_, i) => i), tones: [mark(vals.length, set)] })
