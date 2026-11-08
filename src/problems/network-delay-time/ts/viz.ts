// Trace-only drawing helpers. Never shown on the page.
import { graph, heap as heapPanel, type Panel, type Tone } from '../../../core/panels'

const num = (d: number) => (d === Infinity ? 'inf' : String(d))
const SPOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[18, 50], [82, 50]],
  3: [[50, 12], [14, 82], [86, 82]],
  4: [[12, 50], [44, 12], [44, 88], [86, 50]],
  5: [[8, 50], [34, 12], [34, 88], [64, 50], [92, 50]],
}
const spot = (i: number, n: number): { x: number; y: number } => {
  const s = SPOTS[n]?.[i]
  if (s) return { x: s[0], y: s[1] }
  const a = (2 * Math.PI * i) / n - Math.PI / 2
  return { x: Math.round(50 + 36 * Math.cos(a)), y: Math.round(50 + 36 * Math.sin(a)) }
}

/** One sentence about what the edges out of u just did. */
export function relaxSay(times: number[][], dist: number[], u: number, d: number): string {
  const better = times.filter(([a, b, w]) => a === u && dist[b] === d + w).map(([, b, w]) => `node ${b} to ${d + w}`)
  if (!times.some(([a]) => a === u)) return `Node ${u} has no outgoing links, so there is nothing to update.`
  return better.length ? `Look at the links out of ${u}. Better routes: ${better.join(', ')}. These are tentative until popped.` : `Look at the links out of ${u}. None gives a shorter route than we already know.`
}

/** mode: init, pop, stale, relax, done. Finished nodes are exactly those whose distance is at most the popped distance d. */
export function show(times: number[][], n: number, dist: number[], items: [number, number][], u: number, d: number, mode: string): Panel[] {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: String(i + 1), ...spot(i, n) }))
  const final = (v: number) => dist[v] <= d
  const tones: Record<string, Tone> = {}
  const notes: Record<string, string> = {}
  for (let v = 1; v <= n; v++) {
    notes[String(v)] = num(dist[v])
    if (mode === 'done') tones[String(v)] = dist[v] === Infinity ? 'miss' : 'hit'
    else if (final(v)) tones[String(v)] = 'hit'
    else if (dist[v] !== Infinity) tones[String(v)] = 'keep'
  }
  if (mode === 'init' || mode === 'pop' || mode === 'relax') tones[String(u)] = mode === 'relax' ? 'focus' : 'hit'
  if (mode === 'stale') tones[String(u)] = 'miss'
  const edges = times.map(([a, b, w]) => {
    let tone: Tone | undefined
    if (mode === 'relax' && a === u) tone = dist[b] === d + w ? 'keep' : 'miss'
    else if (mode !== 'init' && mode !== 'done' && a !== u && final(a)) tone = 'dim'
    return { from: String(a), to: String(b), weight: w, directed: true, tone }
  })
  const panels: Panel[] = [graph(nodes, edges, { tones, notes, label: 'number under a node = best known time. Finished nodes are marked as answers' })]
  if (items.length) panels.push(heapPanel(items.map(([dd, v]) => `${v}:${dd}`), { label: 'heap of node:time. Smallest time on top', tones: items.map((_, i): Tone | null => (i === 0 ? 'focus' : null)) }))
  return panels
}
