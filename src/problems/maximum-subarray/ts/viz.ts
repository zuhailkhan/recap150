// Trace-only helpers. Not shown on the page.
import { arr, type ArrayPanel, type Tone } from '../../../core/panels'

/** Where the current run began after processing index i (replays the scan; only for small traced inputs). */
export function runStart(nums: number[], i: number): number {
  if (nums.length > 200) return 0
  let start = 0
  let run = 0
  for (let k = 0; k <= i; k++) {
    if (run < 0) { run = 0; start = k }
    run += nums[k]
  }
  return start
}

/** The array with the current run bracketed. Cells before the run are dim, the run is kept, index i is in focus. */
export function runPanel(nums: number[], s: number, i: number, tone: Tone = 'keep', ptr: number = i): ArrayPanel {
  const tones = nums.map((_, k) => (k < s ? 'dim' : k === i && tone === 'keep' ? 'focus' : k <= i ? tone : null))
  return arr(nums, { label: 'nums (bracket = the current run)', tones, pointers: [{ name: 'i', at: ptr }], window: [s, Math.max(s, i)] })
}
