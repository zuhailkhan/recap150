import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { levelOrder } from './bfs'
import { fromLevel, use } from './viz'

/** Level-order array in, list of levels out. Forwards the tracer. */
export function levelOrderDriver(vals: (number | null)[], t: Tracer = noop): number[][] {
  const root = fromLevel(vals)
  use(root)
  return levelOrder(root, t)
}
