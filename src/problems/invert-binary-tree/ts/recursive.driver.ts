import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { invertTree } from './recursive'
import { fromLevel, layout, use } from './viz'

/** Level-order array in, level-order array out (null = missing child, trailing nulls trimmed). Forwards the tracer. */
export function invertTreeDriver(vals: (number | null)[], t: Tracer = noop): (number | null)[] {
  const root = fromLevel(vals)
  use(root)
  return layout(invertTree(root, t)).items
}
