import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { mergeKLists, type ListNode } from './heap'

const build = (vals: number[]): ListNode | null => vals.reduceRight<ListNode | null>((next, val) => ({ val, next }), null)

/** Arrays in, one merged array out. Forwards the tracer. */
export function mergeKListsDriver(lists: number[][], t: Tracer = noop): number[] {
  const out: number[] = []
  for (let n = mergeKLists(lists.map(build), t); n; n = n.next) out.push(n.val)
  return out
}
