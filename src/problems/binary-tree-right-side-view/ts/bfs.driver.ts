import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { rightSideView } from './bfs'
import { build, type Levels } from './viz'

/** JSON in, JSON out: a level-order array in, the visible values out. Forwards the tracer. */
export function rightSideViewDriver(levels: Levels, t: Tracer = noop): number[] {
  return rightSideView(build(levels), t)
}
