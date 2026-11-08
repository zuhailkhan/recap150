import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { isSameTree } from './recursive'
import { fromLevel, use } from './viz'

/** Two level-order arrays in, true or false out. Forwards the tracer. */
export function isSameTreeDriver(p: (number | null)[], q: (number | null)[], t: Tracer = noop): boolean {
  const a = fromLevel(p)
  const b = fromLevel(q)
  use(a, b)
  return isSameTree(a, b, t)
}
