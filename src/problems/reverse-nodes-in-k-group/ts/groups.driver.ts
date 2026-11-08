import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { reverseKGroup, type ListNode } from './groups'

const build = (vals: number[]): ListNode | null => vals.reduceRight<ListNode | null>((next, val) => ({ val, next }), null)

/** [values], k in; values out. Forwards the tracer. */
export function reverseKGroupDriver(vals: number[], k: number, t: Tracer = noop): number[] {
  const out: number[] = []
  for (let n = reverseKGroup(build(vals), k, t); n; n = n.next) out.push(n.val)
  return out
}
