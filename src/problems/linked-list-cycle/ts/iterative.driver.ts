import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { hasCycle, type ListNode } from './iterative'
import type { Tone } from '../../../core/panels'
import { list } from '../../../core/panels'

/**
 * Trace helper (never shown). Draws the chain from `head` with pointers placed by node identity.
 * Stops at the first repeated node (so cycles are safe) and draws the back arrow with cycleTo.
 * `stop` ends the drawing at that node. `dummy` is drawn as "D".
 */
export function view(head: ListNode | null, ptrs: [string, ListNode | null | undefined, Tone?][] = [], o: { label?: string; dummy?: ListNode; stop?: ListNode; toneOf?: (n: ListNode) => Tone | null } = {}) {
  const path: ListNode[] = []
  const seen = new Set<ListNode>()
  for (let n = head; n && !seen.has(n) && path.length < 40; n = n.next) {
    path.push(n)
    seen.add(n)
    if (n === o.stop) break
  }
  const last = path[path.length - 1]
  const back = last && last !== o.stop && last.next && seen.has(last.next) ? path.indexOf(last.next) : -1
  return list(path.map((n) => (n === o.dummy ? 'D' : n.val)), {
    label: o.label,
    tones: path.map((n) => (n === o.dummy ? 'dim' : o.toneOf?.(n) ?? null)),
    pointers: ptrs.flatMap(([name, n, tone]) => (n && path.includes(n) ? [{ name, at: path.indexOf(n), ...(tone ? { tone } : {}) }] : [])),
    ...(back >= 0 ? { cycleTo: back } : {}),
  })
}

/** vals become nodes. If pos >= 0 the tail next pointer leads to the node at index pos. */
const build = (vals: number[], pos: number): ListNode | null => {
  const nodes: ListNode[] = vals.map((val) => ({ val, next: null }))
  nodes.forEach((n, i) => {
    n.next = nodes[i + 1] ?? null
  })
  if (pos >= 0 && nodes.length) nodes[nodes.length - 1].next = nodes[pos]
  return nodes[0] ?? null
}

/** JSON in, JSON out: [3,2,0,-4], 1 -> true. pos = -1 means no cycle. Forwards the tracer. */
export function hasCycleDriver(vals: number[], pos: number, t: Tracer = noop): boolean {
  return hasCycle(build(vals, pos), t)
}
