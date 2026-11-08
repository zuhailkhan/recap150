import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { KthLargest } from './heap'

/** Replays the operations. One result per operation: null for the constructor, a number for add. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let kl: KthLargest | null = null
  return ops.map((op, i) => {
    const a = args[i]
    if (op === 'KthLargest') {
      kl = new KthLargest(a[0] as number, a[1] as number[], t)
      return null
    }
    if (!kl) throw new Error('KthLargest must be created first')
    if (op === 'add') return kl.add(a[0] as number, t)
    throw new Error(`unknown operation ${op}`)
  })
}
