// Trace-only helpers. Not shown on the page.
import { dp, mark2, type Tone } from '../../../core/panels'

type Mode = 'start' | 'plus' | 'minus' | 'answer'

/** First reachable sum in a row, described in words, for the step sentence. */
export function sample(prev: number[], off: number, step: number): string {
  const c = prev.findIndex((w) => w > 0)
  const w = prev[c]
  return `for example sum ${c - off} (${w} way${w === 1 ? '' : 's'}) lands on sum ${c - off + step}`
}

/** The table up to row i. Rows below i are blank. Counts of 0 show as a dot (no way). */
export function view(table: number[][], nums: number[], total: number, i: number, mode: Mode, x = 0, target = 0) {
  const off = total
  const width = table[0].length
  const cells = table.map((row, r) => row.map((v) => (r > i || v === 0 ? '' : v)))
  const set: [number, number, Tone][] = []
  if (mode === 'plus' || mode === 'minus') {
    const step = mode === 'plus' ? x : -x
    table[i - 1].forEach((w, c) => {
      if (w > 0) {
        set.push([i - 1, c, 'keep'])
        set.push([i, c + step, 'focus'])
      }
    })
  }
  if (mode === 'start') set.push([0, off, 'keep'])
  if (mode === 'answer' && Math.abs(target) <= total) set.push([i, target + off, 'hit'])
  return dp(cells, {
    label: 'dp[i][s] = number of sign choices for the first i numbers (rows) whose total is s (columns). A dot means no way.',
    rowLabels: table.map((_, r) => (r === 0 ? 'none' : `±${nums[r - 1]}`)),
    colLabels: Array.from({ length: width }, (_, c) => c - off),
    tones: mark2(table.length, width, set),
  })
}
