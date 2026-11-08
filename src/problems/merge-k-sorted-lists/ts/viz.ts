// Trace-only drawing helpers. Never shown on the page.
import { heap as heapPanel, list, type Panel, type Tone } from '../../../core/panels'
import type { ListNode, MinHeap } from './heap'

const rest = (n: ListNode): number[] => {
  const out: number[] = []
  for (let c: ListNode | null = n; c && out.length < 12; c = c.next) out.push(c.val)
  return out
}

/** The heap, the lists still waiting (each starts at a node held by the heap), and the answer built so far. */
export function show(h: MinHeap, dummy: ListNode, tail: ListNode, done = false): Panel[] {
  const out: number[] = []
  for (let n = dummy.next; n && out.length < 40; n = n === tail ? null : n.next) out.push(n.val)
  const panels: Panel[] = [heapPanel(h.items.map((n) => n.val), { label: 'min-heap of list heads. The smallest is on top', tones: h.items.map((_, i): Tone | null => (i === 0 ? 'focus' : null)) })]
  h.items.slice(0, 4).forEach((n) => panels.push(list(rest(n), { label: 'a list still waiting. Its head is in the heap', tones: rest(n).map((_, i): Tone | null => (i === 0 ? 'keep' : null)) })))
  panels.push(list(out, { label: 'answer so far', tones: out.map((_, i): Tone | null => (done ? 'hit' : i === out.length - 1 ? 'hit' : 'dim')) }))
  return panels
}
