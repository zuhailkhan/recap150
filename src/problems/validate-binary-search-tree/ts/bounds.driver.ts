import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { isValidBST } from './bounds'
import { build, type Levels } from './viz'

/** JSON in, JSON out: a level-order array in, true or false out. Forwards the tracer. */
export function isValidBSTDriver(levels: Levels, t: Tracer = noop): boolean {
  return isValidBST(build(levels), t)
}
