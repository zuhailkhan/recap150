import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function merge(intervals: number[][], t: Tracer = noop): number[][] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]) // [1] sort a copy by start, numerically
  t.step(1, `Sort a copy by start. Overlapping intervals now sit next to each other.`, view(sorted, -1, []))
  const res: number[][] = []
  for (let i = 0; i < sorted.length; i++) {
    const [start, end] = sorted[i]
    const last: number[] | undefined = res[res.length - 1]
    t.step(2, last ? `Is the start ${start} at or before the last end ${last[1]}? That is the overlap test.` : `${start}..${end} is first, so nothing can overlap it yet.`, view(sorted, i, res))
    if (last && start <= last[1]) { // [2] touching counts as overlap
      last[1] = Math.max(last[1], end) // [3] overlap: stretch the last interval, never shrink it
      t.step(3, `Overlap. Stretch the last interval to end at ${last[1]}, the larger of the two ends.`, view(sorted, i, res))
    } else {
      res.push([start, end]) // [4] gap: start a new merged interval (a fresh array, not the input's)
      t.step(4, `No overlap. Start a new interval [${start}, ${end}].`, view(sorted, i, res))
    }
  }
  t.step(5, `All intervals placed. The merged result has ${res.length} interval${res.length === 1 ? '' : 's'}.`, view(sorted, sorted.length, res, true))
  return res // [5]
}
