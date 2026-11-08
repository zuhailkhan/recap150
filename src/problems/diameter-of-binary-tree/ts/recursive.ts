import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { bend, draw, longestBend, many, paint } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function diameterOfBinaryTree(root: TreeNode | null, t: Tracer = noop): number {
  let best = 0 // [1] longest path found so far, counted in edges
  t.step(1, 'best = 0. We will find the height of every node, and check a path through it on the way.', [draw(0, 'tree. h = height of each node', paint(root, 'keep'))])
  const height = (node: TreeNode | null): number => {
    if (!node) { // [2] an empty spot is 0 tall
      t.step(2, 'An empty spot has height 0.', [draw(0, 'tree. h = height of each node')])
      return 0
    }
    const left = height(node.left) // [3] height of the left side
    const right = height(node.right) // [3] height of the right side
    t.step(3, `Heights below ${node.val}: left ${left}, right ${right}.`, [draw(0, 'tree. h = height of each node', [[node, 'focus']])])
    const through = left + right // [4] the longest path that bends at this node
    best = Math.max(best, through) // [4] keep the larger
    t.step(4, `A path that bends at ${node.val} has ${left} + ${right} = ${through} edges. Best so far: ${best}.`, [draw(0, 'tree. h = height of each node', [...many(bend(node), through === best ? 'hit' : 'focus')], [[`h=${1 + Math.max(left, right)}`, node, 'hit', true]])])
    return 1 + Math.max(left, right) // [5] report my height to the parent
  }
  height(root)
  t.step(5, `Every node has been checked. The longest path has ${best} edges.`, [draw(0, 'tree. h = height of each node', many(longestBend(root), 'hit'))])
  return best // [5]
}
