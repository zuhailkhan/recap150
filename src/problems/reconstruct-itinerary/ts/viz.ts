// Trace-only drawing helpers. Never shown on the page.
import { arr, graph, stack, type Panel, type Tone } from '../../../core/panels'

/** Graph of the tickets (used-up ones go grey), the walk so far, and the route built so far. */
export function show(tickets: string[][], next: Map<string, string[]>, path: string[], route: string[], justTook = false, done = false): Panel[] {
  const ids = [...new Set(['JFK', ...tickets.flat()])]
  const nodes = ids.map((id, i) => {
    const a = (2 * Math.PI * i) / ids.length - Math.PI / 2
    return { id, x: Math.round(50 + 36 * Math.cos(a)), y: Math.round(50 + 36 * Math.sin(a)) }
  })
  const left = new Map<string, number>()
  for (const [from, ds] of next) for (const to of ds) left.set(`${from}>${to}`, (left.get(`${from}>${to}`) ?? 0) + 1)
  const edges = tickets.map(([from, to]) => {
    const key = `${from}>${to}`
    const c = left.get(key) ?? 0
    if (c > 0) { left.set(key, c - 1); return { from, to, directed: true, tone: undefined as Tone | undefined } }
    return { from, to, directed: true, tone: 'dim' as Tone | undefined }
  })
  if (justTook && path.length > 1) {
    const [a, b] = [path[path.length - 2], path[path.length - 1]]
    for (let i = edges.length - 1; i >= 0; i--) if (edges[i].tone === 'dim' && edges[i].from === a && edges[i].to === b) { edges[i].tone = 'focus'; break }
  }
  const tones: Record<string, Tone> = {}
  for (const p of path) tones[p] = 'keep'
  if (path.length > 0) tones[path[path.length - 1]] = 'focus'
  const panels: Panel[] = [graph(nodes, edges, { tones, label: 'tickets. Grey arrows are used up' })]
  if (path.length > 0) panels.push(stack(path, { label: 'walk so far (top = where we are now)' }))
  panels.push(arr(route, { label: done ? 'the itinerary' : 'route so far (built from the back)', tones: route.map(() => 'hit') }))
  return panels
}
