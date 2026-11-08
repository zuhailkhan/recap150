import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import type { Tone } from '../../../core/panels'
import { buckets, graph } from '../../../core/panels'

export interface GraphNode { val: number; neighbors: GraphNode[] }

export function cloneGraph(node: GraphNode | null, t: Tracer = noop): GraphNode | null {
  if (node === null) return null // nothing to copy
  const copies = new Map<GraphNode, GraphNode>() // [1] original node -> its copy
  t.step(1, 'Start with an empty map from originals to copies. Nodes will show up as they get copied.', [graph([], [], { label: 'copy so far' })])

  const dup = (n: GraphNode): GraphNode => {
    const made = copies.get(n)
    if (made !== undefined) {
      t.step(3, `Node ${n.val} already has a copy. Reuse it. Copying again would loop forever on a cycle.`, [graph([...copies.values()].map((c) => String(c.val)), [...copies.values()].flatMap((c) => c.neighbors.filter((x) => x.val > c.val || !x.neighbors.includes(c)).map((x) => ({ from: String(c.val), to: String(x.val) }))), { label: 'copy so far', tones: Object.fromEntries([...copies.values()].map((c) => [String(c.val), (c === made ? 'hit' : 'keep') as Tone])) })])
      return made // [3] already copied: reuse it
    }
    const clone: GraphNode = { val: n.val, neighbors: [] } // [2] a new copy with no links yet
    copies.set(n, clone) // [2] register it before visiting neighbours
    t.step(2, `Make a copy of node ${n.val} and register it. Next, copy its neighbours: [${n.neighbors.map((x) => x.val).join(', ')}].`, [graph([...copies.values()].map((c) => String(c.val)), [...copies.values()].flatMap((c) => c.neighbors.filter((x) => x.val > c.val || !x.neighbors.includes(c)).map((x) => ({ from: String(c.val), to: String(x.val) }))), { label: 'copy so far', tones: Object.fromEntries([...copies.values()].map((c) => [String(c.val), (c === clone ? 'focus' : 'keep') as Tone])) }), buckets([...copies.values()].map((c) => ({ key: String(c.val), items: c.neighbors.map((x) => x.val), tone: c === clone ? 'focus' : undefined })), { label: 'copies and the neighbours linked so far', keyLabel: 'copy of node' })])
    for (const next of n.neighbors) clone.neighbors.push(dup(next)) // [4] link the copy to the copies of its neighbours
    t.step(4, `Node ${n.val} is fully linked: its copy points to [${clone.neighbors.map((x) => x.val).join(', ')}].`, [graph([...copies.values()].map((c) => String(c.val)), [...copies.values()].flatMap((c) => c.neighbors.filter((x) => x.val > c.val || !x.neighbors.includes(c)).map((x) => ({ from: String(c.val), to: String(x.val) }))), { label: 'copy so far', tones: Object.fromEntries([...copies.values()].map((c) => [String(c.val), (c === clone ? 'hit' : 'keep') as Tone])) }), buckets([...copies.values()].map((c) => ({ key: String(c.val), items: c.neighbors.map((x) => x.val), tone: c === clone ? 'hit' : undefined })), { label: 'copies and the neighbours linked so far', keyLabel: 'copy of node' })])
    return clone
  }
  return dup(node)
}
