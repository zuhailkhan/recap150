import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { show } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function goodNodes(root: TreeNode | null, t: Tracer = noop): number {
  const walk = (node: TreeNode | null, highest: number): number => {
    if (!node) return 0
    const good = node.val >= highest ? 1 : 0 // [2] good when nothing above it is bigger
    t.step(2, good ? (highest === -Infinity ? `Nothing is above ${node.val}, so it is good.` : `${node.val} is at least ${highest}, so it is good.`) : `${highest} is above ${node.val} on the path, so ${node.val} is not good.`, [show('tree', [[[node], good ? 'hit' : 'miss']], [{ name: 'here', node }]), arr([highest === -Infinity ? '-inf' : highest], { label: 'highest value above this node' })])
    const best = Math.max(highest, node.val) // [3] the bar the children must reach
    t.step(3, `Both children get the bar ${best}.`, [show('tree', [[[node], 'focus']]), arr([best], { label: 'bar passed to the children', tones: ['keep'] })])
    const left = walk(node.left, best)
    const right = walk(node.right, best)
    t.step(4, `Node ${node.val}: ${good} for itself + ${left} on the left + ${right} on the right = ${good + left + right}.`, [show('tree', [[[node], 'focus']]), arr([good, left, right], { label: 'itself, left, right' })])
    return good + left + right // [4] add up this subtree
  }
  t.step(1, `Start at the root. Nothing is above it, so the bar is minus infinity.`, [show('tree'), arr(['-inf'], { label: 'bar at the root', tones: ['keep'] })])
  return walk(root, -Infinity) // [1] nothing above the root, so the root is always good
}
