// Trace-only drawing helpers. Never shown on the page.
import { arr, dp as dpPanel, mark, type Panel, type Tone } from '../../../core/panels'

/** Earlier indexes whose number is smaller than nums[i]. */
export const smaller = (nums: number[], i: number): number[] => nums.slice(0, i).flatMap((v, j) => (v < nums[i] ? [j] : []))

/** "dp[2] = 1, dp[4] = 2" for the earlier smaller numbers. */
export const readout = (nums: number[], dp: number[], i: number): string => smaller(nums, i).map((j) => `dp[${j}] = ${dp[j]}`).join(', ')

/** nums on top, dp below. Cell i is focus. With `reads`, earlier smaller numbers are keep and the rest miss. Later cells are dim. */
export function view(nums: number[], dp: number[], i: number, reads: boolean, answer = -1): Panel[] {
  const top: Record<number, Tone> = {}
  const row: Record<number, Tone> = {}
  const small = smaller(nums, i)
  for (let k = 0; k < nums.length; k++) {
    if (answer >= 0) { if (k === answer) top[k] = row[k] = 'hit' }
    else if (k > i) row[k] = 'dim'
    else if (k === i) top[k] = row[k] = 'focus'
    else if (reads) top[k] = row[k] = small.includes(k) ? 'keep' : 'miss'
  }
  return [
    arr(nums, { label: 'nums', tones: mark(nums.length, top) }),
    dpPanel([dp], { label: 'dp[i] = longest increasing run that ends at i', colLabels: nums.map((_, k) => k), tones: [mark(nums.length, row)] }),
  ]
}
