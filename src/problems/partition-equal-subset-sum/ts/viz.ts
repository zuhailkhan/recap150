// Trace-only drawing helpers. Never shown on the page.
import { arr, dp as dpPanel, mark, type Panel, type Tone } from '../../../core/panels'

/** The numbers (finished ones dim, the current one focus) and the reachable-sums row. */
export function view(nums: number[], dp: boolean[], k: number, set: Record<number, Tone> = {}): Panel[] {
  return [
    arr(nums, { label: 'numbers', tones: mark(nums.length, Object.fromEntries(nums.map((_, j) => [j, j < k ? 'dim' : j === k ? 'focus' : null]).filter(([, v]) => v))) }),
    dpPanel([dp.map((v) => (v ? 'T' : 'F'))], { label: 'dp[s] = can some of the numbers so far add up to s?', colLabels: dp.map((_, s) => s), tones: [mark(dp.length, set)] }),
  ]
}
