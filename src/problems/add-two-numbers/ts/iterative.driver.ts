import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { addTwoNumbers, type ListNode } from './iterative'

const build = (vals: number[]): ListNode | null => vals.reduceRight<ListNode | null>((next, val) => ({ val, next }), null)

const flatten = (head: ListNode | null): number[] => {
  const out: number[] = []
  for (let n = head; n; n = n.next) out.push(n.val)
  return out
}

/** JSON in, JSON out: [2,4,3], [5,6,4] -> [7,0,8] (342 + 465 = 807). Forwards the tracer. */
export function addTwoNumbersDriver(a: number[], b: number[], t: Tracer = noop): number[] {
  return flatten(addTwoNumbers(build(a), build(b), t))
}
