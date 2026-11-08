// Trace-only drawing helpers. Never shown on the page.
import { arr, intervals, type Panel, type Tone } from '../../../core/panels'

/**
 * Replays the greedy on the first `done` sorted intervals to colour them: kept = hit, dropped = miss.
 * cur is the interval being compared (focus). The mark is the end of the last kept interval.
 */
export function view(sorted: number[][], done: number, cur: number): Panel[] {
  const lo = Math.min(...sorted.map((s) => s[0]))
  const hi = Math.max(1, ...sorted.map((s) => s[1]))
  const verdicts: boolean[] = []
  let keptEnd = sorted[0][1]
  for (let j = 0; j < done; j++) {
    const keep = j === 0 || sorted[j][0] >= keptEnd
    if (keep) keptEnd = sorted[j][1]
    verdicts.push(keep)
  }
  const tone = (j: number): Tone | undefined => (j < done ? (verdicts[j] ? 'hit' : 'miss') : j === cur ? 'focus' : undefined)
  return [
    intervals(sorted.map(([start, end], j) => ({ start, end, tone: tone(j) })), { label: 'sorted by end. Dashed line = end of the last kept interval', min: lo, max: hi, marks: [{ at: keptEnd, label: `end ${keptEnd}` }] }),
    arr(verdicts.map((k) => (k ? 'keep' : 'drop')), { label: 'decisions so far', tones: verdicts.map((k): Tone => (k ? 'hit' : 'miss')) }),
  ]
}
