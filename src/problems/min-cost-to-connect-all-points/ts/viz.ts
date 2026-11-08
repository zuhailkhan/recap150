// Trace-only drawing helpers. Never shown on the page.
import { arr, graph, type Panel, type Tone } from '../../../core/panels'

const manhattan = (a: number[], b: number[]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])

/** Replays Prim for `rounds` rounds to learn which tree point each link comes from (the solution itself does not need it). */
function links(points: number[][], rounds: number, relaxLast: boolean): number[] {
  const n = points.length
  const d = new Array<number>(n).fill(Infinity), from = new Array<number>(n).fill(-1), seen = new Array<boolean>(n).fill(false)
  d[0] = 0
  for (let r = 0; r < rounds; r++) {
    let u = -1
    for (let i = 0; i < n; i++) if (!seen[i] && (u === -1 || d[i] < d[u])) u = i
    seen[u] = true
    if (r === rounds - 1 && !relaxLast) break
    for (let v = 0; v < n; v++) if (!seen[v] && manhattan(points[u], points[v]) < d[v]) { d[v] = manhattan(points[u], points[v]); from[v] = u }
  }
  return from
}

const num = (d: number) => (d === Infinity ? 'inf' : String(d))

/** Say which outside points just found a cheaper link through u. */
export function gain(points: number[][], dist: number[], inTree: boolean[], u: number): string {
  const link = links(points, inTree.filter(Boolean).length, true)
  const better = link.map((l, v) => (l === u && !inTree[v] ? v : -1)).filter((v) => v >= 0)
  const left = inTree.filter((x) => !x).length
  if (left === 0) return `Point ${u} was the last one. Nothing is left outside the tree.`
  if (!better.length) return `Point ${u} is not closer than the links we already have. No cost changes.`
  return `Check each outside point against point ${u}. Cheaper links through ${u}: ${better.map((v) => `point ${v}`).join(', ')}.`
}

/** Points laid out as on a map, the tree edges, the best link each outside point has, and the cost array. */
export function show(points: number[][], dist: number[], inTree: boolean[], hot: number, done = false, first = false, relaxed = false): Panel[] {
  const link = links(points, inTree.filter(Boolean).length, relaxed || done)
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1])
  const lo = [Math.min(...xs), Math.min(...ys)]
  const sp = [Math.max(...xs) - lo[0], Math.max(...ys) - lo[1]]
  const place = (v: number, k: number) => (sp[k] === 0 ? 50 : Math.round(12 + (76 * (v - lo[k])) / sp[k]))
  const nodes = points.map((p, i) => ({ id: String(i), x: place(p[0], 0), y: 100 - place(p[1], 1) }))
  const edges = link.flatMap((l, v) => (l < 0 ? [] : [{ from: String(l), to: String(v), weight: dist[v], tone: (inTree[v] ? 'hit' : relaxed && l === hot ? 'focus' : undefined) as Tone | undefined }]))
  const tones: Record<string, Tone> = {}
  points.forEach((_, i) => { if (done) tones[String(i)] = 'hit'; else if (inTree[i]) tones[String(i)] = 'keep' })
  if (first) tones['0'] = 'focus'
  if (hot >= 0) tones[String(hot)] = 'focus'
  const notes: Record<string, string> = {}
  points.forEach((_, i) => { if (!inTree[i]) notes[String(i)] = num(dist[i]) })
  const panels: Panel[] = [graph(nodes, edges, { tones, notes, label: 'points as on a map. Green lines are in the tree. A number under a point = its cheapest link so far' })]
  panels.push(arr(dist.map(num), { label: 'cost to join the tree, by point', tones: dist.map((_, i): Tone | null => (i === hot ? 'focus' : inTree[i] ? 'keep' : null)) }))
  if (first) panels.push(arr(points.map((p) => `${p[0]},${p[1]}`), { label: 'point i sits at (x,y)' }))
  return panels
}
