import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { show } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function maxPathSum(root: TreeNode | null, t: Tracer = noop): number {
  let best = -Infinity // [1] the best path found anywhere so far
  t.step(1, `No path found yet, so best starts at minus infinity. A path can start and end at any node.`, [show('tree'), arr(['-inf'], { label: 'best path sum so far', tones: ['keep'] })])
  const gain = (node: TreeNode | null): number => {
    if (!node) return 0
    const left = Math.max(0, gain(node.left)) // [2] what each child offers upward, never less than 0
    const right = Math.max(0, gain(node.right))
    t.step(2, `Children of ${node.val} offer ${left} (left) and ${right} (right). A branch that would lower the sum is dropped, so it offers 0.`, [show('tree', [[[node], 'focus'], [[left > 0 ? node.left : null, right > 0 ? node.right : null], 'keep']]), arr([left, node.val, right], { label: 'left offer, node, right offer', tones: ['keep', 'focus', 'keep'] })])
    const bend = node.val + left + right
    best = Math.max(best, bend) // [3] a path may bend here: left side + node + right side
    t.step(3, `A path bending at ${node.val} uses both sides: ${node.val} + ${left} + ${right} = ${bend}. Best so far: ${best}.`, [show('tree', [[[node, left > 0 ? node.left : null, right > 0 ? node.right : null], bend === best ? 'hit' : 'focus']]), arr([best], { label: 'best path sum so far', tones: [bend === best ? 'hit' : 'keep'] })])
    const up = node.val + Math.max(left, right)
    t.step(4, `To pass ${node.val} up to its parent, the path may use only one side: ${node.val} + ${Math.max(left, right)} = ${up}.`, [show('tree', [[[node], 'dim'], [[left >= right ? node.left : node.right], 'focus']]), arr([up], { label: 'offered to the parent', tones: ['focus'] })])
    return up // [4] going up, the path may continue through only one child
  }
  gain(root)
  t.step(5, `Every node was tried as the bend. The answer is ${best}.`, [show('best path', []), arr([best], { label: 'answer', tones: ['hit'] })])
  return best // [5]
}
