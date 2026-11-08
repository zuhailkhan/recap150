import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { serialize, deserialize } from './codec'
import { build, levelOrder, type Levels } from './viz'

/** Round trip: level-order array in, serialize, deserialize, level-order array out. It should equal the input. Forwards the tracer. */
export function roundTripDriver(levels: Levels, t: Tracer = noop): Levels {
  const text = serialize(build(levels), t)
  return levelOrder(deserialize(text, t)).nodes
}
