import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { maxDepth } from './recursive'
import { fromLevel, use } from './viz'

/** Level-order array in, depth out. Forwards the tracer. */
export function maxDepthDriver(vals: (number | null)[], t: Tracer = noop): number {
  const root = fromLevel(vals)
  use(root)
  return maxDepth(root, t)
}
