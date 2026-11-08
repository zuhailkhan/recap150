import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { draw } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function maxDepth(root: TreeNode | null, t: Tracer = noop): number {
  if (!root) { // [1] an empty spot is 0 levels deep
    t.step(1, 'An empty spot has depth 0.', [draw(0, 'tree. h = what each node returned')])
    return 0
  }
  t.step(2, `Arrive at ${root.val}. Ask its left and right sides how deep they go.`, [draw(0, 'tree. h = what each node returned', [[root, 'focus']])])
  const left = maxDepth(root.left, t) // [2] depth of the left side
  const right = maxDepth(root.right, t) // [2] depth of the right side
  const depth = 1 + Math.max(left, right) // [3] this node adds one level on top of the deeper side
  t.step(3, `Left is ${left}, right is ${right}. This node returns 1 + max(${left}, ${right}) = ${depth}.`, [draw(0, 'tree. h = what each node returned', [[root, 'hit', true], [root, 'focus']], [[`h=${depth}`, root, 'hit', true]])])
  return depth // [3]
}
