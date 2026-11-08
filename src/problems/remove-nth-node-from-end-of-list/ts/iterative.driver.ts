import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { removeNthFromEnd, type ListNode } from './iterative'
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

const build = (vals: number[]): ListNode | null => vals.reduceRight<ListNode | null>((next, val) => ({ val, next }), null)

const flatten = (head: ListNode | null): number[] => {
  const out: number[] = []
  for (let n = head; n; n = n.next) out.push(n.val)
  return out
}

/** JSON in, JSON out: [1,2,3,4,5], 2 -> [1,2,3,5]. Forwards the tracer. */
export function removeNthFromEndDriver(vals: number[], n: number, t: Tracer = noop): number[] {
  return flatten(removeNthFromEnd(build(vals), n, t))
}
