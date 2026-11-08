import { arr, dp, mark, type Panel, type Tone, type Tones } from '../../../core/panels'

/** One-row DP table for one run. Cells that are not filled yet show "?". */
export const view = (vals: number[], filled: number, set: Record<number, Tone>): Panel =>
  dp([vals.map((v, i) => (i < filled ? v : '?'))], { label: 'dp[k] = most loot from the first k houses of this run', colLabels: vals.map((_, i) => i), tones: [mark(vals.length, set)] })

/** The street. Houses outside the run [lo, hi) are dim. `set` colours individual houses. */
export const street = (nums: number[], lo: number, hi: number, set: Record<number, Tone> = {}): Panel => {
  const tones: Tones = nums.map((_, i) => set[i] ?? (i < lo || i >= hi ? 'dim' : null))
  return arr(nums, { label: 'houses in a circle (dim = left out of this run)', tones, window: [lo, hi - 1] })
}
