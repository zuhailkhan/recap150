import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { show, fmt } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function isValidBST(root: TreeNode | null, t: Tracer = noop): boolean {
  const check = (node: TreeNode | null, low: number, high: number): boolean => {
    if (!node) return true
    const inside = node.val > low && node.val < high // [2] must sit strictly between the two bounds
    t.step(2, inside ? `${node.val} is between ${fmt(low)} and ${fmt(high)}. It fits.` : `${node.val} is not between ${fmt(low)} and ${fmt(high)}. This tree is not a search tree.`, [show('tree', [[[node], inside ? 'hit' : 'miss']], [{ name: 'here', node }]), arr([fmt(low), node.val, fmt(high)], { label: 'low < value < high', tones: ['keep', inside ? 'hit' : 'miss', 'keep'] })])
    if (!inside) return false
    t.step(3, `Left side of ${node.val}: everything there must be below ${node.val}. The upper bound drops to ${node.val}.`, [show('tree', [[[node], 'focus']]), arr([fmt(low), fmt(node.val)], { label: 'window for the left child (low, high)', tones: ['keep', 'focus'] })])
    if (!check(node.left, low, node.val)) return false // [3] left subtree: the upper bound becomes this value
    t.step(4, `Right side of ${node.val}: everything there must be above ${node.val}. The lower bound rises to ${node.val}.`, [show('tree', [[[node], 'focus']]), arr([fmt(node.val), fmt(high)], { label: 'window for the right child (low, high)', tones: ['focus', 'keep'] })])
    return check(node.right, node.val, high) // [4] right subtree: the lower bound becomes this value
  }
  t.step(1, `Start with no limits: low is minus infinity and high is infinity.`, [show('tree'), arr(['-inf', 'inf'], { label: 'window for the root (low, high)', tones: ['keep', 'keep'] })])
  return check(root, -Infinity, Infinity) // [1] the root may be any value
}
