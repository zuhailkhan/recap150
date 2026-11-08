import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function minMeetingRooms(intervals: number[][], t: Tracer = noop): number {
  const starts = intervals.map((x) => x[0]).sort((a, b) => a - b) // [1] starts and ends sorted on their own; the pairing is not needed
  const ends = intervals.map((x) => x[1]).sort((a, b) => a - b)
  let rooms = 0
  let e = 0 // ends[e] is the earliest end that has not been matched to a start yet
  t.step(1, `Sort the starts and the ends separately. Their pairing does not matter, only how many are open at once.`, view(intervals, starts, ends, 0, 0, 0, 'sorted'))
  for (let i = 0; i < starts.length; i++) {
    t.step(2, `Next start ${starts[i]}. The earliest end ahead of it is ${ends[e]}. Is ${starts[i]} < ${ends[e]}?`, view(intervals, starts, ends, i, e, rooms, 'look'))
    if (starts[i] < ends[e]) { // [2] strict: a meeting starting exactly at an end can use that room
      rooms++ // [3] nothing has ended yet, so this meeting needs a new room
      t.step(3, `Yes. No meeting has ended by ${starts[i]}, so open another room. Rooms: ${rooms}.`, view(intervals, starts, ends, i, e, rooms, 'open'))
    } else {
      e++ // [4] a meeting has ended, so its room is free to reuse
      t.step(4, `No. The meeting that ended at ${ends[e - 1]} freed its room, so this start reuses it. Rooms stay ${rooms}.`, view(intervals, starts, ends, i, e, rooms, 'reuse'))
    }
  }
  t.step(5, `All starts are placed. The most rooms ever open at once is ${rooms}.`, view(intervals, starts, ends, starts.length, e, rooms, 'done'))
  return rooms // [5]
}
