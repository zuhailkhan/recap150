// Trace-only drawing helpers. Never shown on the page.
import { arr, graph, type Panel, type Tone } from '../../../core/panels'

const num = (d: number) => (d === Infinity ? 'inf' : String(d))
const SPOTS: Record<number, [number, number][]> = {
  2: [[18, 50], [82, 50]],
  3: [[50, 12], [14, 82], [86, 82]],
  4: [[12, 50], [44, 10], [44, 90], [88, 50]],
}
const spot = (i: number, n: number): { x: number; y: number } => {
  const s = SPOTS[n]?.[i]
  if (s) return { x: s[0], y: s[1] }
  const a = (2 * Math.PI * i) / n - Math.PI / 2
  return { x: Math.round(50 + 36 * Math.cos(a)), y: Math.round(50 + 36 * Math.sin(a)) }
}

/** The map of flights plus the old costs (read only) and the new costs (being written). */
export function show(n: number, flights: number[][], old: number[], next: number[], src: number, dst: number, round: number, relaxed = false, done = false): Panel[] {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: String(i), ...spot(i, n) }))
  const tones: Record<string, Tone> = {}
  const notes: Record<string, string> = {}
  for (let i = 0; i < n; i++) {
    notes[String(i)] = num(next[i])
    if (relaxed && next[i] < old[i]) tones[String(i)] = 'keep'
  }
  tones[String(src)] = 'focus'
  if (done) tones[String(dst)] = next[dst] === Infinity ? 'miss' : 'hit'
  const edges = flights.map(([from, to, price]) => ({
    from: String(from), to: String(to), weight: price, directed: true,
    tone: (relaxed && old[from] !== Infinity && old[from] + price === next[to] && next[to] < old[to] ? 'keep' : undefined) as Tone | undefined,
  }))
  const panels: Panel[] = [graph(nodes, edges, { tones, notes, label: `from city ${src} to city ${dst}. Number under a city = cheapest price known` })]
  if (round > 0 && !done) panels.push(arr(old.map(num), { label: `cost at the start of round ${round} (read only)` }))
  panels.push(arr(next.map(num), { label: done ? 'final cost per city' : round > 0 ? `next (being written in round ${round})` : 'cost per city', tones: next.map((c, i): Tone | null => (done && i === dst ? (c === Infinity ? 'miss' : 'hit') : relaxed && c < old[i] ? 'keep' : null)) }))
  return panels
}
