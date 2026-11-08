import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { MedianFinder } from './heaps'
import { show } from './viz'

/** Replays the operations. One result per operation: null for the constructor and addNum, a number for findMedian. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let mf: MedianFinder | null = null
  return ops.map((op, i) => {
    const a = args[i] as number[]
    if (op === 'MedianFinder') {
      mf = new MedianFinder()
      t.step(1, 'Two heaps. The lower half is a max-heap, the upper half a min-heap, so their tops are the two middle values.', show(mf.lower.items, mf.upper.items, null))
      return null
    }
    if (!mf) throw new Error('MedianFinder must be created first')
    if (op === 'addNum') {
      mf.addNum(a[0], t)
      return null
    }
    if (op === 'findMedian') {
      const median = mf.findMedian()
      const odd = mf.lower.size > mf.upper.size
      t.step(4, odd ? `Odd count. The extra number on top of the lower half is the median: ${median}.` : `Even count. The median is the mean of the two tops: ${median}.`, show(mf.lower.items, mf.upper.items, 'hit', true))
      return median
    }
    throw new Error(`unknown operation ${op}`)
  })
}
