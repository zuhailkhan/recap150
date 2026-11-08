import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { flipView, whole } from './viz'

export interface ListNode {
  val: number
  next: ListNode | null
}

export function reverseKGroup(head: ListNode | null, k: number, t: Tracer = noop): ListNode | null {
  const dummy: ListNode = { val: 0, next: head }
  let groupPrev = dummy // [1] the node just before the next group
  while (true) {
    let kth: ListNode | null = groupPrev // [1] walk k steps to find the last node of the group
    for (let i = 0; i < k && kth; i++) kth = kth.next
    if (!kth) {
      t.step(1, `Fewer than ${k} nodes are left, so the last group is too short. Leave it exactly as it is.`, whole(dummy, groupPrev, null, [['groupPrev', groupPrev]]))
      break // [1] a short tail stays unreversed
    }
    const groupNext = kth.next // [2] remember the node after the group
    t.step(1, `The next group runs from ${groupPrev.next!.val} to ${kth.val}. groupNext is ${groupNext ? groupNext.val : 'null'}, the first node after it.`, whole(dummy, groupPrev, kth, [['groupPrev', groupPrev], ['kth', kth]]))
    let prev: ListNode | null = groupNext // [2] start prev at groupNext, so the first flipped node points past the group
    let cur = groupPrev.next
    while (cur && cur !== groupNext) {
      const next: ListNode | null = cur.next // [2] standard reversal, but stop at the end of the group
      cur.next = prev
      prev = cur
      cur = next
      t.step(2, `Flip ${prev.val}: it now points at ${prev.next ? prev.next.val : 'null'}.`, flipView(dummy, groupPrev, prev, cur, groupNext))
    }
    const front = groupPrev.next! // [3] the old first node is now the group's last node
    groupPrev.next = kth // [3] stitch: the block before points at the group's new first node
    groupPrev = front
    t.step(3, `Stitch: the block before now points at ${kth.val}. ${front.val} is the group's last node, so it is the next groupPrev.`, whole(dummy, groupPrev, null, [['groupPrev', groupPrev]]))
  }
  t.step(4, 'No more full groups. The head may have changed, so return dummy.next.', whole(dummy, groupPrev, null, []))
  return dummy.next // [4] the dummy hides the head change
}
