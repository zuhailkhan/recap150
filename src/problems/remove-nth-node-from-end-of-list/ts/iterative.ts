import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './iterative.driver'

export interface ListNode {
  val: number
  next: ListNode | null
}

export function removeNthFromEnd(head: ListNode | null, n: number, t: Tracer = noop): ListNode | null {
  const dummy: ListNode = { val: 0, next: head } // [1] a fake head, so removing the real head is not special
  let slow = dummy // [1] slow will stop one node before the one to remove
  let fast = dummy // [1] fast runs ahead
  t.step(1, `Put a fake node D in front. slow and fast both start on it. We will remove the ${n}th node from the end.`, [view(dummy, [['slow', slow], ['fast', fast, 'keep']], { label: 'list', dummy })])
  for (let i = 0; i < n; i++) {
    fast = fast.next! // [2] open a gap of n nodes between slow and fast
    t.step(2, `Move fast ahead by one. The gap between slow and fast is now ${i + 1}.`, [view(dummy, [['slow', slow], ['fast', fast, 'keep']], { label: 'list', dummy })])
  }
  while (fast.next) {
    slow = slow.next! // [3] move both until fast is on the last node
    fast = fast.next
    t.step(3, `Move both one step. The gap stays ${n}. fast is on ${fast.val}.`, [view(dummy, [['slow', slow], ['fast', fast, 'keep']], { label: 'list', dummy })])
  }
  t.step(4, `fast is on the last node, so slow.next (${slow.next!.val}) is the n-th from the end. Cut it out.`, [view(dummy, [['slow', slow], ['fast', fast, 'keep']], { label: 'list', dummy, toneOf: (x) => (x === slow.next ? 'miss' : null) })])
  slow.next = slow.next!.next // [4] skip over the node
  t.step(5, 'The link now jumps over the removed node. Return D.next as the new head.', [view(dummy.next, [['head', dummy.next, 'hit']], { label: 'answer', toneOf: () => 'hit' })])
  return dummy.next // [5] the real head (it may have changed)
}
