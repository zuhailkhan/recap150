import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, stack as stackPanel } from '../../../core/panels'
import { show } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function kthSmallest(root: TreeNode | null, k: number, t: Tracer = noop): number {
  const stack: TreeNode[] = []
  let cur = root // [1] cur is where we are, the stack holds the nodes we still owe a visit
  let count = 0
  t.step(1, `Start at the root. The stack is empty and nothing is counted yet. We want number ${k}.`, [show('tree', [[[cur], 'focus']], [{ name: 'cur', node: cur }]), stackPanel([], { label: 'stack (top is the right end)', empty: 'empty' })])
  while (cur || stack.length > 0) {
    while (cur) { // [2] dive left, leaving a trail of nodes to come back to
      stack.push(cur)
      t.step(2, `Push ${cur.val} and go left. Smaller values are on the left.`, [show('tree', [[stack, 'keep'], [[cur], 'focus']], [{ name: 'top', node: cur }]), stackPanel(stack.map((n) => n.val), { label: 'stack (top is the right end)' })])
      cur = cur.left
    }
    const node = stack.pop()! // [3] nothing smaller is left, so this is the next smallest
    count++
    t.step(3, `Pop ${node.val}. It is number ${count} in sorted order.`, [show('tree', [[stack, 'keep'], [[node], 'focus']], [{ name: 'popped', node }]), stackPanel(stack.map((n) => n.val), { label: 'stack (top is the right end)', empty: 'empty' }), arr([count, k], { label: 'count and k', tones: ['focus', 'keep'] })])
    if (count === k) {
      t.step(4, `The count reached k = ${k}, so ${node.val} is the answer.`, [show('tree', [[[node], 'hit']]), arr([count, k], { label: 'count and k', tones: ['hit', 'hit'] })])
      return node.val // [4] the count reached k
    }
    cur = node.right // [5] then everything in this node's right subtree
    t.step(5, cur ? `Done with ${node.val}. Now its right child ${cur.val}.` : `${node.val} has no right child. Back to the stack.`, [show('tree', [[stack, 'keep'], [[node], 'dim'], [[cur], 'focus']], [{ name: 'cur', node: cur }]), stackPanel(stack.map((n) => n.val), { label: 'stack (top is the right end)', empty: 'empty' })])
  }
  return -1
}
