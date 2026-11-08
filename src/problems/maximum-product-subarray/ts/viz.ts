// Trace-only drawing helpers. Never shown on the page.
import { arr, dp as dpPanel, mark, type Panel, type Tone } from '../../../core/panels'

type Hot = { hi?: Tone; lo?: Tone }

/** nums on top, then the hi and lo rows filled up to the given cells. `at` is the index in focus. */
export function view(nums: number[], hi: number[], lo: number[], at: number, hiTo: number, loTo: number, reads: boolean, hot: Hot): Panel[] {
  const fill = (v: number[], to: number) => v.map((x, k) => (k <= to ? x : ''))
  const row = (tone?: Tone): Record<number, Tone> => {
    const set: Record<number, Tone> = {}
    if (reads) set[at - 1] = 'keep'
    if (tone) set[at] = tone
    return set
  }
  return [
    arr(nums, { label: 'nums', tones: mark(nums.length, reads || hot.hi === 'focus' ? { [at]: 'focus' } : {}) }),
    dpPanel([fill(hi, hiTo), fill(lo, loTo)], {
      label: 'hi[i] = biggest product of a subarray ending at i. lo[i] = smallest',
      rowLabels: ['hi', 'lo'],
      colLabels: nums.map((_, k) => k),
      tones: [mark(nums.length, row(hot.hi)), mark(nums.length, row(hot.lo))],
    }),
  ]
}
