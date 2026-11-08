import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { show, rightmost } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function rightSideView(root: TreeNode | null, t: Tracer = noop): number[] {
  const view: number[] = []
  let level: TreeNode[] = root ? [root] : [] // [1] the current row, starting with the root
  t.step(1, `The first row holds only the root. Rows go top to bottom.`, [show('tree', [[level, 'focus']]), arr(level.map((n) => n.val), { label: 'current row (queue)' })])
  while (level.length > 0) {
    const next: TreeNode[] = []
    t.step(2, `Walk row ${view.length + 1} from left to right: ${level.map((n) => n.val).join(', ')}.`, [show('tree', [[rightmost(view.length), 'hit'], [level, 'focus']]), arr(level.map((n) => n.val), { label: 'current row (queue)' })])
    for (const node of level) { // [2] walk the row left to right
      if (node.left) next.push(node.left) // [3] queue the children for the next row
      if (node.right) next.push(node.right)
    }
    t.step(3, next.length ? `Their children, left to right, are the next row: ${next.map((n) => n.val).join(', ')}.` : `No node in this row has children, so this is the last row.`, [show('tree', [[rightmost(view.length), 'hit'], [level, 'dim'], [next, 'keep']]), arr(next.map((n) => n.val), { label: 'next row (queue)' })])
    view.push(level[level.length - 1].val) // [4] the last node in the row is the one you see
    t.step(4, `The last node of the row is ${view[view.length - 1]}. A viewer on the right sees it, so it goes in the answer.`, [show('tree', [[level, 'dim'], [rightmost(view.length), 'hit']]), arr(view, { label: 'view so far', tones: view.map(() => 'hit' as const) })])
    level = next
  }
  t.step(5, `No rows are left. The answer is ${view.join(', ')}.`, [show('right side view', [[rightmost(view.length), 'hit']]), arr(view, { label: 'answer', tones: view.map(() => 'hit' as const) })])
  return view // [5] one value per row
}
