import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { isBalanced } from './recursive'
import { fromLevel, use } from './viz'

/** Level-order array in, true or false out. Forwards the tracer. */
export function isBalancedDriver(vals: (number | null)[], t: Tracer = noop): boolean {
  const root = fromLevel(vals)
  use(root)
  return isBalanced(root, t)
}
