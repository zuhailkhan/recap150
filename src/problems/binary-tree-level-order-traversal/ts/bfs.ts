import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { draw, many } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function levelOrder(root: TreeNode | null, t: Tracer = noop): number[][] {
  const result: number[][] = []
  if (!root) return result // [1] nothing to visit
  const queue: TreeNode[] = [root] // [1] nodes waiting their turn, front first
  t.step(1, `The queue starts with the root, ${root.val}.`, [draw(0, 'tree', many(queue, 'keep')), arr(queue.map((n) => n.val), { label: 'queue (front on the left)', pointers: [{ name: 'front', at: 0 }] }), arr([], { label: 'result' })])
  while (queue.length > 0) {
    const size = queue.length // [2] freeze the level: this many nodes belong to it
    t.step(2, `The queue holds ${size} node${size === 1 ? '' : 's'}. That is exactly one whole level. Handle ${size} now.`, [draw(0, 'tree', many(queue, 'focus')), arr(queue.map((n) => n.val), { label: 'queue: this level', tones: queue.map(() => 'focus'), pointers: [{ name: 'front', at: 0 }] }), arr(result.map((l) => `[${l.join(',')}]`), { label: 'result so far' })])
    const level: number[] = []
    for (let i = 0; i < size; i++) {
      const node = queue.shift()! // [3] take the front node
      level.push(node.val) // [3] record it in this level
      if (node.left) queue.push(node.left) // [3] its children wait for the next level
      if (node.right) queue.push(node.right)
      t.step(3, `Take ${node.val} from the front. Record it, and queue its children.`, [draw(0, 'tree', [[node, 'dim', true], ...many(queue, 'keep'), [node, 'focus']]), arr(queue.map((n) => n.val), { label: 'queue (front on the left)', tones: queue.map(() => 'keep') }), arr(level, { label: 'this level so far', tones: level.map(() => 'focus') })])
    }
    result.push(level) // [4] the level is complete
    t.step(4, `Level done: [${level.join(', ')}]. Whatever is queued now is the next level.`, [draw(0, 'tree', many(queue, 'keep')), arr(queue.map((n) => n.val), { label: 'queue (front on the left)', tones: queue.map(() => 'keep') }), arr(result.map((l) => `[${l.join(',')}]`), { label: 'result so far', tones: result.map((_, i) => (i === result.length - 1 ? 'hit' : null)) })])
  }
  return result
}
