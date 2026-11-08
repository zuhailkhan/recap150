// Trace-only drawing helpers. Never shown on the page.
import { list, type Panel, type Tone } from '../../../core/panels'
import type { ListNode } from './groups'

const chain = (from: ListNode | null, stop: ListNode | null = null): ListNode[] => {
  const out: ListNode[] = []
  for (let n = from; n && n !== stop && out.length < 40; n = n.next) out.push(n)
  return out
}

/** The whole list from the dummy (D). Nodes up to `locked` are finished, nodes up to `groupEnd` are the group in hand, the rest is waiting. */
export function whole(dummy: ListNode, locked: ListNode, groupEnd: ListNode | null, ptrs: [string, ListNode][]): Panel[] {
  const ns = chain(dummy)
  const li = ns.indexOf(locked)
  const gi = groupEnd ? ns.indexOf(groupEnd) : li
  const tones = ns.map((_, i): Tone | null => (i === 0 ? 'dim' : i <= li ? 'hit' : i <= gi ? 'focus' : groupEnd ? null : 'dim'))
  const label = groupEnd ? 'whole list. Green = finished, blue = this group, plain = waiting' : 'whole list. Green = finished, grey = left alone'
  return [list(ns.map((n, i) => (i === 0 ? 'D' : n.val)), { label, tones, pointers: ptrs.map(([name, n]) => ({ name, at: ns.indexOf(n), tone: name === 'kth' ? ('keep' as const) : ('focus' as const) })) })]
}

/** Mid-reversal. The list is cut into pieces, so draw the pieces: finished blocks, the reversed part, the part still to flip. */
export function flipView(dummy: ListNode, groupPrev: ListNode, prev: ListNode | null, cur: ListNode | null, groupNext: ListNode | null): Panel[] {
  const locked = groupPrev === dummy ? [] : chain(dummy.next, groupPrev).concat(groupPrev)
  const tail = (tones: (Tone | null)[], items: (number)[]) => (groupNext ? { items: [...items, groupNext.val], tones: [...tones, 'dim' as Tone] } : { items, tones })
  const rev = chain(prev, groupNext)
  const todo = chain(cur, groupNext)
  const r = tail(rev.map((): Tone | null => 'keep'), rev.map((n) => n.val))
  const d = tail(todo.map((_, i): Tone | null => (i === 0 ? 'focus' : null)), todo.map((n) => n.val))
  return [
    list(locked.map((n) => n.val), { label: 'finished blocks', tones: locked.map((): Tone | null => 'hit') }),
    list(r.items, { label: 'reversed so far. prev is its first node (grey = after the group)', tones: r.tones, pointers: rev.length ? [{ name: 'prev', at: 0, tone: 'keep' }] : [] }),
    list(d.items, { label: 'still to flip. cur is its first node (grey = after the group)', tones: d.tones, pointers: [{ name: 'cur', at: 0 }] }),
  ]
}
