import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function insert(intervals: number[][], newInterval: number[], t: Tracer = noop): number[][] {
  const res: number[][] = []
  let [start, end] = newInterval // two plain numbers, so the input pair is never edited
  let i = 0
  while (i < intervals.length && intervals[i][1] < start) { // [1] ends strictly before the new start: no touching, keep as is
    res.push([...intervals[i]])
    i++
    t.step(1, `${intervals[i - 1][1]} < ${start}: [${intervals[i - 1]}] ends before the new interval starts. Copy it.`, view(intervals, i, true, [start, end], res, -1, start, 'start'))
  }
  while (i < intervals.length && intervals[i][0] <= end) { // [2] starts at or before the new end: overlaps (touching counts), absorb it
    start = Math.min(start, intervals[i][0])
    end = Math.max(end, intervals[i][1])
    i++
    t.step(2, `${intervals[i - 1][0]} <= the new end, so [${intervals[i - 1]}] overlaps. The new interval grows to [${start}, ${end}].`, view(intervals, i, true, [start, end], res, -1, end, 'end'))
  }
  const at = res.length
  res.push([start, end]) // [3] the grown interval goes in after everything to its left
  t.step(3, `Place the new interval [${start}, ${end}]. Nothing to its right overlaps it.`, view(intervals, i, false, [start, end], res, at, end, 'end'))
  while (i < intervals.length) { // [4] everything left starts after the new end: copy it
    res.push([...intervals[i]])
    i++
    t.step(4, `[${intervals[i - 1]}] starts after the new end. Copy it.`, view(intervals, i, true, [start, end], res, at, end, 'end'))
  }
  t.step(4, `Nothing is left. The result has ${res.length} interval${res.length === 1 ? '' : 's'}.`, view(intervals, i, false, [start, end], res, at, end, 'end', true))
  return res // [4]
}
