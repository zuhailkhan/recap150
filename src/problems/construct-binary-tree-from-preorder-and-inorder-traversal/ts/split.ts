import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, fromMap } from '../../../core/panels'
import { grow, built, split } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function buildTree(preorder: number[], inorder: number[], t: Tracer = noop): TreeNode | null {
  const where = new Map<number, number>() // [1] value -> its position in inorder
  inorder.forEach((v, i) => where.set(v, i))
  let next = 0 // [1] preorder lists the next root first
  t.step(1, `Index the inorder array by value, so any root can be found at once. next = 0 points at the first root.`, [arr(preorder, { label: 'preorder', pointers: [{ name: 'next', at: 0 }] }), arr(inorder, { label: 'inorder' }), buckets(fromMap(where), { label: 'value to inorder position', keyLabel: 'value' })])
  const build = (lo: number, hi: number): TreeNode | null => {
    if (lo > hi) return null
    const val = preorder[next++] // [2] the next unused preorder value is the root of this range
    const mid = where.get(val)!
    const node: TreeNode = { val, left: null, right: null }
    t.step(2, `Root of inorder ${lo}..${hi} is ${val}, the next preorder value. Inorder puts it at ${mid}.`, [grow(node, lo, hi, mid), ...split(preorder, inorder, val, next, lo, hi, mid, 'both')])
    t.step(3, `Left of the root: inorder ${lo}..${mid - 1}, which is ${mid - lo} value(s).`, [built('tree built so far', node), ...split(preorder, inorder, val, next, lo, hi, mid, 'left')])
    node.left = build(lo, mid - 1) // [3] values left of the root in inorder form the left subtree
    t.step(4, `Right of the root: inorder ${mid + 1}..${hi}, which is ${hi - mid} value(s).`, [built('tree built so far', node), ...split(preorder, inorder, val, next, lo, hi, mid, 'right')])
    node.right = build(mid + 1, hi) // [4] values right of the root form the right subtree
    return node
  }
  const root = build(0, inorder.length - 1)
  t.step(5, `Every value is placed. The tree is done.`, [built('finished tree', undefined, true)])
  return root // [5] the first call built the root
}
