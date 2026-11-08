import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function eraseOverlapIntervals(intervals: number[][], t: Tracer = noop): number {
  if (intervals.length === 0) return 0
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]) // [1] sort a copy by END: the interval that finishes first leaves the most room
  let keptEnd = sorted[0][1] // the first one is always kept
  let removed = 0
  t.step(1, `Sort a copy by end. Keep the first one, [${sorted[0]}]. Its end ${keptEnd} is the line to beat.`, view(sorted, 1, -1))
  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i]
    t.step(2, `Does [${start}, ${end}] start at or after ${keptEnd}? Touching is fine here, so the test is start >= end.`, view(sorted, i, i))
    if (start >= keptEnd) { // [2] no overlap with the last kept interval
      keptEnd = end // [3] keep it, and move the line to its end
      t.step(3, `${start} is not before the kept end, so there is no overlap. Keep it. The line moves to ${end}.`, view(sorted, i + 1, -1))
    } else {
      removed++ // [4] overlaps the kept one, which ends no later: drop this one
      t.step(4, `${start} is before ${keptEnd}, so it overlaps. Remove it. Removed so far: ${removed}.`, view(sorted, i + 1, -1))
    }
  }
  t.step(5, `Every interval is decided. The minimum number to remove is ${removed}.`, view(sorted, sorted.length, -1))
  return removed // [5]
}
