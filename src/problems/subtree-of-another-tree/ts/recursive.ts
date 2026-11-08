import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { draw, paint } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function isSubtree(root: TreeNode | null, subRoot: TreeNode | null, t: Tracer = noop): boolean {
  if (!subRoot) return true // [1] an empty tree fits inside any tree
  if (!root) { // [1] ran out of tree without a match
    t.step(1, 'Ran out of tree here. Nothing to match against.', [draw(0, 'big tree'), draw(1, 'looking for', paint(subRoot, 'keep'))])
    return false
  }
  const found = sameTree(root, subRoot) // [2] does the copy start exactly here?
  t.step(2, found ? `Starting at ${root.val}, everything matches. Found it.` : `Try matching the whole pattern at ${root.val}. It does not fit.`, [draw(0, 'big tree', found ? paint(root, 'hit', true) : [[root, 'miss', true]]), draw(1, 'looking for', paint(subRoot, found ? 'hit' : 'keep'))])
  if (found) return true
  t.step(3, `No match at ${root.val}. Look in its left side, then its right side.`, [draw(0, 'big tree', [[root, 'focus']]), draw(1, 'looking for', paint(subRoot, 'keep'))])
  return isSubtree(root.left, subRoot, t) || isSubtree(root.right, subRoot, t) // [3] try the children as new starting points
}

// [2] same check as Same Tree: shape and values must match all the way down
function sameTree(a: TreeNode | null, b: TreeNode | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.val === b.val && sameTree(a.left, b.left) && sameTree(a.right, b.right)
}
