import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { lowestCommonAncestor } from './walk'
import { fromLevel, use } from './viz'

/** Level-order BST and two values in, the value of their lowest common ancestor out (null if the walk finds none). Forwards the tracer. */
export function lowestCommonAncestorDriver(vals: (number | null)[], p: number, q: number, t: Tracer = noop): number | null {
  const root = fromLevel(vals)
  use(root)
  return lowestCommonAncestor(root, p, q, t)?.val ?? null
}
