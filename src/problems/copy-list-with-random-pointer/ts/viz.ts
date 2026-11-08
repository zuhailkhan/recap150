// Trace-only drawing helpers. Never shown on the page.
import { buckets, list, type BucketsPanel, type ListPanel, type Tone } from '../../../core/panels'
import type { Node } from './hashmap'

const chain = (head: Node | null): Node[] => {
  const out: Node[] = []
  for (let n = head; n && out.length < 40; n = n.next) out.push(n)
  return out
}

interface Look { at?: Node | null; hit?: Node | null; dim?: boolean; all?: Tone }

/** A list with its random pointers drawn as dashed arrows under the row. */
export function view(head: Node | null, label: string, o: Look = {}): ListPanel {
  const ns = chain(head)
  const links: { from: number; to: number }[] = []
  ns.forEach((n, from) => {
    const to = n.random ? ns.indexOf(n.random) : -1
    if (to >= 0) links.push({ from, to })
  })
  const tones = ns.map((n): Tone | null => (n === o.at ? 'focus' : n === o.hit ? 'keep' : o.all ?? (o.dim ? 'dim' : null)))
  const at = o.at ? ns.indexOf(o.at) : -1
  return list(ns.map((n) => n.val), { label: `${label}. Dashed arrows are random`, tones, links, pointers: at >= 0 ? [{ name: 'n', at }] : [] })
}

export function mapView(head: Node | null, copy: Map<Node, Node>): BucketsPanel {
  const ns = chain(head)
  return buckets([...copy].map(([old, twin]) => ({ key: `old #${ns.indexOf(old)} (${old.val})`, items: [`new ${twin.val}`], tone: 'keep' as const })), { label: 'map: old node to its twin', empty: 'empty' })
}
