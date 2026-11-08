import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { TimeMap } from './timeline'

/** Replays the operations. [ops, args] in, one result per operation out (null for TimeMap and set). Forwards the tracer. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let tm = new TimeMap()
  return ops.map((op, i) => {
    const a = args[i]
    if (op === 'TimeMap') { tm = new TimeMap(); return null }
    if (op === 'set') { tm.set(a[0] as string, a[1] as string, a[2] as number, t); return null }
    return tm.get(a[0] as string, a[1] as number, t)
  })
}
