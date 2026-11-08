import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { isSubtree } from './recursive'
import { fromLevel, use } from './viz'

/** Two level-order arrays in (big tree, pattern), true or false out. Forwards the tracer. */
export function isSubtreeDriver(root: (number | null)[], sub: (number | null)[], t: Tracer = noop): boolean {
  const a = fromLevel(root)
  const b = fromLevel(sub)
  use(a, b)
  return isSubtree(a, b, t)
}
