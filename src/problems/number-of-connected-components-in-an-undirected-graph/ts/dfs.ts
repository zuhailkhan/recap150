import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { graph, stack } from '../../../core/panels'

export function countComponents(n: number, edges: number[][], t: Tracer = noop): number {
  const adj: number[][] = Array.from({ length: n }, () => []) // [1] neighbours of every node
  for (const [a, b] of edges) {
    adj[a].push(b)
    adj[b].push(a)
  }
  t.step(1, `${n} nodes and ${edges.length} edges. Each node gets a list of its neighbours. Every edge is stored twice, once per end.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b) })), { label: 'nodes 0 to ' + (n - 1) })])

  const group: number[] = Array(n).fill(0) // group[v] = which component v was reached in. 0 = not reached yet
  let count = 0
  for (let start = 0; start < n; start++) {
    if (group[start] !== 0) continue
    count++ // [2] start is in a group nobody has reached: a new component
    group[start] = count
    const todo = [start]
    t.step(2, `Node ${start} has not been reached by any earlier walk. A new component starts here: number ${count}.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b) })), { label: `component ${count} begins`, tones: Object.fromEntries(group.flatMap((g, v) => (g === 0 ? [] : [[String(v), g === count ? (v === start ? 'focus' : 'keep') : 'dim'] as const]))), notes: Object.fromEntries(group.flatMap((g, v) => (g === 0 ? [] : [[String(v), `#${g}`] as const]))) }), stack(todo, { label: 'to do (stack)' })])
    while (todo.length > 0) {
      const v = todo.pop()! // [3] take a node and look at its neighbours
      t.step(3, `Take node ${v} from the stack. Its neighbours: ${adj[v].length === 0 ? 'none' : adj[v].join(', ')}.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b), tone: a === v || b === v ? ('focus' as const) : undefined })), { label: `walking component ${count}`, tones: Object.fromEntries(group.flatMap((g, u) => (g === 0 ? [] : [[String(u), u === v ? 'focus' : g === count ? 'keep' : 'dim'] as const]))), notes: Object.fromEntries(group.flatMap((g, u) => (g === 0 ? [] : [[String(u), `#${g}`] as const]))) }), stack(todo, { label: 'to do (stack)', empty: 'empty' })])
      const added: number[] = []
      for (const w of adj[v]) {
        if (group[w] === 0) { // [4] unseen neighbour: it is in this component too
          group[w] = count
          todo.push(w)
          added.push(w)
        }
      }
      t.step(4, added.length === 0 ? `Every neighbour of ${v} is already reached. Nothing to push.` : `${added.join(', ')} ${added.length === 1 ? 'was' : 'were'} not reached yet. Mark ${added.length === 1 ? 'it' : 'them'} as component ${count} and push ${added.length === 1 ? 'it' : 'them'}.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b), tone: (a === v && added.includes(b)) || (b === v && added.includes(a)) ? ('keep' as const) : undefined })), { label: `component ${count} grows`, tones: Object.fromEntries(group.flatMap((g, u) => (g === 0 ? [] : [[String(u), added.includes(u) ? 'focus' : g === count ? 'keep' : 'dim'] as const]))), notes: Object.fromEntries(group.flatMap((g, u) => (g === 0 ? [] : [[String(u), `#${g}`] as const]))) }), stack(todo, { label: 'to do (stack)' })])
    }
  }
  t.step(5, `Every node has been reached. The walk started ${count} times, so there ${count === 1 ? 'is 1 component' : `are ${count} components`}.`, [graph(Array.from({ length: n }, (_, i) => i), edges.map(([a, b]) => ({ from: String(a), to: String(b) })), { label: `${count} component${count === 1 ? '' : 's'}`, tones: Object.fromEntries(group.map((g, v) => [String(v), 'hit'] as const)), notes: Object.fromEntries(group.map((g, v) => [String(v), `#${g}`] as const)) })])
  return count // [5] one start per component
}
