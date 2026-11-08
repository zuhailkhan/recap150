import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, graph } from '../../../core/panels'

export function validTree(n: number, edges: number[][], t: Tracer = noop): boolean {
  t.step(1, `A tree on ${n} nodes has exactly ${n - 1} edges. This graph has ${edges.length}. ${edges.length === n - 1 ? 'The count fits, so check it is connected.' : 'The count is wrong, so it cannot be a tree.'}`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b) })), { label: `${edges.length} edges, need ${n - 1}`, tones: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i), edges.length === n - 1 ? 'keep' : 'miss'])) })])
  if (edges.length !== n - 1) return false // [1] wrong edge count: too few can't connect, too many must loop

  const adj: number[][] = Array.from({ length: n }, () => []) // [2] neighbours of every node
  for (const [a, b] of edges) {
    adj[a].push(b)
    adj[b].push(a)
  }
  const seen: boolean[] = Array(n).fill(false)
  const queue = [0] // [2] start the walk at node 0
  seen[0] = true
  t.step(2, `Neighbour lists are built. Start a breadth-first walk at node 0 and mark it reached.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b) })), { label: 'walk starts at 0', tones: { 0: 'focus' } }), arr(queue, { label: 'queue, front on the left' })])

  for (let head = 0; head < queue.length; head++) {
    const v = queue[head] // [3] take the next node from the front
    t.step(3, `Take node ${v}. Its neighbours: ${adj[v].length === 0 ? 'none' : adj[v].join(', ')}.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b), tone: a === v || b === v ? ('focus' as const) : undefined })), { label: `reached ${queue.length} of ${n}`, tones: Object.fromEntries(seen.flatMap((s, u) => (s ? [[String(u), u === v ? 'focus' : 'keep'] as const] : []))) }), arr(queue.slice(head), { label: 'queue, front on the left' })])
    const added: number[] = []
    for (const w of adj[v]) {
      if (!seen[w]) { // [4] a new node: mark it and queue it
        seen[w] = true
        queue.push(w)
        added.push(w)
      }
    }
    t.step(4, added.length === 0 ? `Nothing new next to ${v}. Reached so far: ${queue.length} of ${n}.` : `${added.join(', ')} ${added.length === 1 ? 'is' : 'are'} new. Mark and queue ${added.length === 1 ? 'it' : 'them'}. Reached so far: ${queue.length} of ${n}.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b), tone: (a === v && added.includes(b)) || (b === v && added.includes(a)) ? ('keep' as const) : undefined })), { label: `reached ${queue.length} of ${n}`, tones: Object.fromEntries(seen.flatMap((s, u) => (s ? [[String(u), added.includes(u) ? 'focus' : 'keep'] as const] : []))) }), arr(queue.slice(head + 1), { label: 'queue, front on the left' })])
  }
  t.step(5, queue.length === n ? `The walk reached all ${n} nodes. Connected with ${n - 1} edges: a tree.` : `The walk reached only ${queue.length} of ${n} nodes. The graph is split, so it is not a tree.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b) })), { label: queue.length === n ? 'a tree' : 'not connected', tones: Object.fromEntries(seen.map((s, u) => [String(u), s ? (queue.length === n ? 'hit' : 'keep') : 'miss'] as const)) })])
  return queue.length === n // [5] reached everything: connected
}
