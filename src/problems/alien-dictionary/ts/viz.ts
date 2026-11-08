// Trace-only drawing helpers. Never shown on the page.
import { arr, graph, type Panel, type Tone } from '../../../core/panels'

interface Opts {
  pair?: number
  bad?: boolean
  indegree?: Map<string, number>
  queue?: string[]
  head?: number
  order?: string
  cur?: string
  done?: boolean
}

const firstDiff = (a: string, b: string): [string, string] | null => {
  for (let j = 0; j < Math.min(a.length, b.length); j++) if (a[j] !== b[j]) return [a[j], b[j]]
  return null
}

/** One sentence about what comparing two neighbouring words tells us. */
export function pairSay(a: string, b: string): string {
  const d = firstDiff(a, b)
  if (d) return `"${a}" comes before "${b}". The first different letters are ${d[0]} and ${d[1]}, so ${d[0]} comes before ${d[1]}. Later letters say nothing.`
  if (a.length > b.length) return `"${a}" comes before "${b}", but "${b}" is its prefix and shorter. A shorter prefix must come first, so no alphabet works. Answer: empty string.`
  return `"${a}" comes before "${b}". One is a prefix of the other, which is fine. No new rule.`
}

/** Letters as nodes (rules as arrows), the word list while comparing, then the queue and the output while sorting. */
export function show(words: string[], after: Map<string, Set<string>>, o: Opts): Panel[] {
  const ids = [...after.keys()]
  const nodes = ids.map((id, i) => {
    const a = (2 * Math.PI * i) / ids.length - Math.PI / 2
    return { id, x: Math.round(50 + 36 * Math.cos(a)), y: Math.round(50 + 36 * Math.sin(a)) }
  })
  const out = o.order ?? ''
  const focusEdge = o.pair !== undefined && o.pair >= 0 && !o.bad ? firstDiff(words[o.pair], words[o.pair + 1]) : null
  const edges = ids.flatMap((a) => [...after.get(a)!].map((b) => {
    let tone: Tone | undefined
    if (focusEdge && focusEdge[0] === a && focusEdge[1] === b) tone = 'focus'
    else if (out.includes(a)) tone = 'dim'
    return { from: a, to: b, directed: true, tone }
  }))
  const tones: Record<string, Tone> = {}
  const notes: Record<string, string> = {}
  if (o.queue) {
    o.queue.slice(o.head ?? 0).forEach((c) => (tones[c] = 'keep'))
    for (const c of out) tones[c] = 'hit'
    if (o.cur) tones[o.cur] = 'focus'
    if (o.indegree) for (const [c, n] of o.indegree) if (!out.includes(c)) notes[c] = `in ${n}`
  }
  const panels: Panel[] = [graph(nodes, edges, { tones, notes, label: o.queue ? 'arrow = must come before. "in n" = rules still pointing at the letter' : 'arrow x -> y means x must come before y' })]
  if (o.pair !== undefined) {
    const p = o.pair
    const wt = words.map((_, i): Tone | null => (i === p || i === p + 1 ? (o.bad ? 'miss' : 'focus') : i < p ? 'dim' : null))
    panels.push(arr(words, { label: 'words in the given order', tones: p >= 0 ? wt : undefined }))
  }
  if (o.queue) {
    const waiting = o.queue.slice(o.head ?? 0)
    panels.push(arr(waiting, { label: 'queue: letters ready to output', tones: waiting.map(() => 'keep') }))
    panels.push(arr([...out], { label: 'order so far', tones: [...out].map(() => 'hit') }))
  }
  return panels
}
