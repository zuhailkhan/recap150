import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { DetectSquares } from './countmap'

/** Replays the operations. One result per operation: null for the constructor and add, a number for count. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let ds: DetectSquares | null = null
  return ops.map((op, i) => {
    const a = args[i] as number[]
    if (op === 'DetectSquares') {
      ds = new DetectSquares()
      return null
    }
    if (!ds) throw new Error('DetectSquares must be created first')
    if (op === 'add') {
      ds.add(a, t)
      return null
    }
    if (op === 'count') return ds.count(a, t)
    throw new Error(`unknown operation ${op}`)
  })
}
