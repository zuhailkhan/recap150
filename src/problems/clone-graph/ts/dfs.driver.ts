import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { cloneGraph, type GraphNode } from './dfs'

// The solution only draws the copies it has made. This wrapper puts every node of the
// input on a fixed circle, so nodes do not jump around. Not yet copied nodes are dimmed.
const fixedLayout = (n: number, t: Tracer): Tracer => ({
  step(stage, say, panels) {
    t.step(stage, say, panels.map((p) => {
      if (p.kind !== 'graph') return p
      const made = new Set(p.nodes.map((x) => x.id))
      const nodes = Array.from({ length: n }, (_, i) => {
        const a = (2 * Math.PI * i) / n - Math.PI / 2
        return { id: String(i + 1), x: 50 + 38 * Math.cos(a), y: 50 + 38 * Math.sin(a) }
      })
      const tones = { ...Object.fromEntries(nodes.filter((x) => !made.has(x.id)).map((x) => [x.id, 'dim' as const])), ...p.tones }
      return { ...p, nodes, tones }
    }))
  },
})

// Input: adjacency list, node i+1 has neighbours adj[i]. Output: the adjacency list read back from the copy.
export function cloneGraphDriver(adj: number[][], t: Tracer = noop): number[][] {
  const nodes: GraphNode[] = adj.map((_, i) => ({ val: i + 1, neighbors: [] }))
  adj.forEach((ns, i) => { nodes[i].neighbors = ns.map((v) => nodes[v - 1]) })
  const copy = cloneGraph(nodes.length > 0 ? nodes[0] : null, fixedLayout(adj.length, t))
  if (copy === null) return []
  const originals = new Set(nodes)
  const byVal = new Map<number, GraphNode>()
  const queue = [copy]
  while (queue.length > 0) {
    const n = queue.shift()!
    if (originals.has(n)) throw new Error('the clone shares a node with the original')
    const known = byVal.get(n.val)
    if (known !== undefined) {
      if (known !== n) throw new Error(`two different copies of node ${n.val}`)
      continue
    }
    byVal.set(n.val, n)
    queue.push(...n.neighbors)
  }
  return adj.map((_, i) => (byVal.get(i + 1)?.neighbors.map((x) => x.val) ?? []))
}
