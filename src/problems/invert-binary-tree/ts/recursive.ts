import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { draw } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function invertTree(root: TreeNode | null, t: Tracer = noop): TreeNode | null {
  if (!root) { // [1] nothing here, nothing to flip
    t.step(1, 'An empty spot. Nothing to flip, so this call returns null.', [draw(0, 'tree now')])
    return null
  }
  t.step(2, `Arrive at ${root.val}. Flip everything below it first, then swap its two sides.`, [draw(0, 'tree now', [[root, 'focus']])])
  const left = invertTree(root.right, t) // [2] the flipped right side becomes the new left
  const right = invertTree(root.left, t) // [2] the flipped left side becomes the new right
  root.left = left // [3] swap: both sides are already flipped
  root.right = right
  t.step(3, `Swap the sides of ${root.val}. Everything under it is now mirrored.`, [draw(0, 'tree now', [[root, 'hit', true], [root, 'focus']])])
  return root // [3] hand the finished subtree back to the parent
}
