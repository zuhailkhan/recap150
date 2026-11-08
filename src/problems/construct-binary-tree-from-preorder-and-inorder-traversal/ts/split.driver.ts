import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { buildTree } from './split'
import { levelOrder, reset, type Levels } from './viz'

/** JSON in, JSON out: both traversals in, the new tree as a level-order array out. Forwards the tracer. */
export function buildTreeDriver(preorder: number[], inorder: number[], t: Tracer = noop): Levels {
  reset()
  return levelOrder(buildTree(preorder, inorder, t)).nodes
}
