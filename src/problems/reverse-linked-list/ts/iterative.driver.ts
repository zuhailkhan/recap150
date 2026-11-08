import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { reverseList, type ListNode } from './iterative'

const build = (vals: number[]): ListNode | null => vals.reduceRight<ListNode | null>((next, val) => ({ val, next }), null)

const flatten = (head: ListNode | null): number[] => {
  const out: number[] = []
  for (let n = head; n; n = n.next) out.push(n.val)
  return out
}

/** JSON in, JSON out: [1,2,3] -> [3,2,1]. Forwards the tracer. */
export function reverseListDriver(vals: number[], t: Tracer = noop): number[] {
  return flatten(reverseList(build(vals), t))
}
