// Trace-only drawing helpers. Never shown on the page.
import { buckets, list, type Panel, type Tone } from '../../../core/panels'
import type { LRUCache } from './linked'

/** The doubly linked list (H, most recent ... least recent, T) and the key -> node map. */
export function show(c: LRUCache, o: { hit?: number } = {}): Panel[] {
  const nodes = []
  for (let n = c.head.next; n && n !== c.tail && nodes.length < 40; n = n.next) nodes.push(n)
  const over = c.map.size > c.capacity
  const tones: (Tone | null)[] = ['dim', ...nodes.map((n, i): Tone | null => (n.key === o.hit ? 'hit' : over && i === nodes.length - 1 ? 'miss' : null)), 'dim']
  const last = nodes.length
  const pointers = last === 0 ? [] : last === 1 ? [{ name: 'recent=oldest', at: 1 }] : [{ name: 'recent', at: 1 }, { name: 'oldest', at: last, tone: 'keep' as const }]
  return [
    list(['H', ...nodes.map((n) => `${n.key}:${n.val}`), 'T'], { label: `list, key:value. Capacity ${c.capacity}`, doubly: true, tones, pointers }),
    buckets([...c.map].map(([k, n]) => ({ key: String(k), items: [`node ${k}:${n.val}`], tone: k === o.hit ? ('hit' as const) : undefined })), { label: 'map: key to node', keyLabel: 'key', empty: 'empty' }),
  ]
}
