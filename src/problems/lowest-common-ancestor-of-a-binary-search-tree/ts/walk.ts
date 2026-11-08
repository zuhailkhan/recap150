import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { draw, find } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function lowestCommonAncestor(root: TreeNode | null, p: number, q: number, t: Tracer = noop): TreeNode | null {
  let node = root // [1] start at the top
  t.step(1, `Start at the root. We are looking for the lowest node that has both ${p} and ${q} below it (or is one of them).`, [draw(0, 'BST', [[node, 'focus']], [['p', find(root, p), 'keep', true], ['q', find(root, q), 'keep', true]])])
  while (node) {
    if (p < node.val && q < node.val) { // [2] both are smaller, so both live on the left
      t.step(2, `${p} and ${q} are both smaller than ${node.val}. They are both on the left. Go left.`, [draw(0, 'BST', [[node, 'dim', true], [node.left, 'focus']]), arr([p, node.val, q], { label: 'p, this node, q', tones: ['keep', 'focus', 'keep'] })])
      node = node.left
    } else if (p > node.val && q > node.val) { // [3] both are bigger, so both live on the right
      t.step(3, `${p} and ${q} are both bigger than ${node.val}. They are both on the right. Go right.`, [draw(0, 'BST', [[node, 'dim', true], [node.right, 'focus']]), arr([p, node.val, q], { label: 'p, this node, q', tones: ['keep', 'focus', 'keep'] })])
      node = node.right
    } else { // [4] the paths split here, or this node is one of them
      t.step(4, `${node.val} is not smaller than both, nor bigger than both. ${p} and ${q} go different ways here (or one is ${node.val}). This is the answer.`, [draw(0, 'BST', [[node, 'hit']]), arr([p, node.val, q], { label: 'p, this node, q', tones: ['keep', 'hit', 'keep'] })])
      return node
    }
  }
  return null
}
