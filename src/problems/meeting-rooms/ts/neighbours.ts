import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function canAttendMeetings(intervals: number[][], t: Tracer = noop): boolean {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]) // [1] sort a copy by start, numerically
  t.step(1, `Sort a copy by start. If any two meetings clash, some neighbouring pair clashes.`, view(sorted, 0, 'none'))
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1][1]
    t.step(2, `Does [${sorted[i]}] start before the previous meeting ends at ${prevEnd}?`, view(sorted, i, 'look'))
    if (sorted[i][0] < prevEnd) { // [2] strict: starting exactly when the last one ends is fine
      t.step(3, `${sorted[i][0]} < ${prevEnd}: the two meetings overlap, so one person cannot attend both.`, view(sorted, i, 'clash'))
      return false // [3]
    }
  }
  t.step(3, `No neighbouring pair overlaps, so every meeting can be attended.`, view(sorted, sorted.length, 'done'))
  return true // [3]
}
