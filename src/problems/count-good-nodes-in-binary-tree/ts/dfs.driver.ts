import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { goodNodes } from './dfs'
import { build, type Levels } from './viz'

/** JSON in, JSON out: a level-order array in, the count out. Forwards the tracer. */
export function goodNodesDriver(levels: Levels, t: Tracer = noop): number {
  return goodNodes(build(levels), t)
}
