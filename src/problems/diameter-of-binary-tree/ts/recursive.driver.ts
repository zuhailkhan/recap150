import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { diameterOfBinaryTree } from './recursive'
import { fromLevel, use } from './viz'

/** Level-order array in, diameter (in edges) out. Forwards the tracer. */
export function diameterDriver(vals: (number | null)[], t: Tracer = noop): number {
  const root = fromLevel(vals)
  use(root)
  return diameterOfBinaryTree(root, t)
}
