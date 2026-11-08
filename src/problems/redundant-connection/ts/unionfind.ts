import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { dp, graph } from '../../../core/panels'

export function findRedundantConnection(edges: number[][], t: Tracer = noop): number[] {
  const n = edges.length // n nodes, numbered 1..n, and n edges
  const parent = Array.from({ length: n + 1 }, (_, i) => i) // [1] every node starts as its own group leader
  t.step(1, `${n} nodes, each alone in its own group. parent[v] = v means v is the leader (root) of its group.`, [graph(Array.from({ length: n }, (_, i) => i + 1), [], { label: 'no edges yet', tones: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i + 1), 'keep'])) }), dp([parent.slice(1)], { label: 'parent', rowLabels: ['parent'], colLabels: parent.slice(1).map((_, i) => i + 1), tones: [parent.slice(1).map(() => 'keep')] })])

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]] // [2] path halving: hop x closer to the root as we climb
      x = parent[x]
    }
    return x
  }

  for (let i = 0; i < n; i++) {
    const [a, b] = edges[i]
    const ra = find(a) // [2] leader of a's group
    const rb = find(b) // [2] leader of b's group
    t.step(2, `Edge ${a}-${b}. The leader of ${a} is ${ra}, the leader of ${b} is ${rb}. ${ra === rb ? 'Same leader: same group.' : 'Different leaders: different groups.'}`, [graph(Array.from({ length: n }, (_, k) => k + 1), edges.slice(0, i + 1).map(([u, v], k) => ({ from: String(u), to: String(v), tone: k === i ? ('focus' as const) : undefined })), { label: `edge ${a}-${b} under test. Leaders are marked`, tones: { ...Object.fromEntries(parent.flatMap((p, v) => (v > 0 && p === v ? [[String(v), 'keep'] as const] : []))), [String(a)]: 'focus' as const, [String(b)]: 'focus' as const }, notes: Object.fromEntries(parent.flatMap((p, v) => (v > 0 && p === v ? [[String(v), 'leader'] as const] : []))) }), dp([parent.slice(1)], { label: 'parent', rowLabels: ['parent'], colLabels: parent.slice(1).map((_, k) => k + 1), tones: [parent.slice(1).map((p, k) => (p === k + 1 ? 'keep' : null))] })])
    if (ra === rb) { // [3] already connected: this edge closes a loop
      t.step(3, `${a} and ${b} are already connected through ${ra}. Adding ${a}-${b} would close a loop, so it is the redundant edge.`, [graph(Array.from({ length: n }, (_, k) => k + 1), edges.slice(0, i + 1).map(([u, v], k) => ({ from: String(u), to: String(v), tone: k === i ? ('miss' as const) : undefined })), { label: 'this edge closes a loop', tones: { [String(a)]: 'miss' as const, [String(b)]: 'miss' as const } }), dp([parent.slice(1)], { label: 'parent', rowLabels: ['parent'], colLabels: parent.slice(1).map((_, k) => k + 1), tones: [parent.slice(1).map((p, k) => (p === k + 1 ? 'keep' : null))] })])
      return [a, b]
    }
    parent[ra] = rb // [4] different groups: merge them under one leader
    t.step(4, `Merge: leader ${ra} now points to ${rb}. Edge ${a}-${b} joins the two groups.`, [graph(Array.from({ length: n }, (_, k) => k + 1), edges.slice(0, i + 1).map(([u, v], k) => ({ from: String(u), to: String(v), tone: k === i ? ('hit' as const) : undefined })), { label: 'groups merged', tones: Object.fromEntries(parent.flatMap((p, v) => (v > 0 && p === v ? [[String(v), 'keep'] as const] : []))), notes: Object.fromEntries(parent.flatMap((p, v) => (v > 0 && p === v ? [[String(v), 'leader'] as const] : []))) }), dp([parent.slice(1)], { label: 'parent', rowLabels: ['parent'], colLabels: parent.slice(1).map((_, k) => k + 1), tones: [parent.slice(1).map((p, k) => (k + 1 === ra ? 'focus' : p === k + 1 ? 'keep' : null))] })])
  }
  return []
}
