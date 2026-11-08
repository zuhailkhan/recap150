import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { draw } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function isSameTree(p: TreeNode | null, q: TreeNode | null, t: Tracer = noop): boolean {
  if (!p && !q) { // [1] both are empty here: they match
    t.step(1, 'Both sides are empty at this spot. That matches.', [draw(0, 'p'), draw(1, 'q')])
    return true
  }
  if (!p || !q) { // [2] only one has a node: different shapes
    t.step(2, 'Only one tree has a node here. The shapes differ, so the answer is false.', [draw(0, 'p', [[p, 'miss']]), draw(1, 'q', [[q, 'miss']])])
    return false
  }
  if (p.val !== q.val) { // [2] same spot, different values
    t.step(2, `Same spot, but ${p.val} and ${q.val} differ. The answer is false.`, [draw(0, 'p', [[p, 'miss']]), draw(1, 'q', [[q, 'miss']])])
    return false
  }
  t.step(3, `Both have ${p.val}. Now compare the two left sides, then the two right sides.`, [draw(0, 'p', [[p, 'hit', true]]), draw(1, 'q', [[q, 'hit', true]])])
  return isSameTree(p.left, q.left, t) && isSameTree(p.right, q.right, t) // [3] both sides must match
}
