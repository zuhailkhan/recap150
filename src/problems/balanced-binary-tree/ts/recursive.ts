import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { draw, paint } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function isBalanced(root: TreeNode | null, t: Tracer = noop): boolean {
  let balanced = true // [1] stays true until some node is lopsided
  t.step(1, 'balanced = true. We will find the height of every node, and compare its two sides on the way.', [draw(0, 'tree. h = height of each node', paint(root, 'keep'))])
  const height = (node: TreeNode | null): number => {
    if (!node) { // [2] an empty spot is 0 tall
      t.step(2, 'An empty spot has height 0.', [draw(0, 'tree. h = height of each node')])
      return 0
    }
    const left = height(node.left) // [3] height of the left side
    const right = height(node.right) // [3] height of the right side
    t.step(3, `Heights below ${node.val}: left ${left}, right ${right}.`, [draw(0, 'tree. h = height of each node', [[node, 'focus']])])
    if (Math.abs(left - right) > 1) balanced = false // [4] the sides differ by 2 or more
    t.step(4, Math.abs(left - right) > 1 ? `${left} and ${right} differ by more than 1. ${node.val} is lopsided, so the tree is not balanced.` : `${left} and ${right} differ by at most 1. ${node.val} is fine.`, [draw(0, 'tree. h = height of each node', [[node, Math.abs(left - right) > 1 ? 'miss' : 'hit', true]], [[`h=${1 + Math.max(left, right)}`, node, 'hit', true]])])
    return 1 + Math.max(left, right) // [5] report my height to the parent
  }
  height(root)
  t.step(5, balanced ? 'No node was lopsided. The tree is balanced.' : 'At least one node was lopsided. The tree is not balanced.', [draw(0, 'tree. h = height of each node')])
  return balanced // [5]
}
