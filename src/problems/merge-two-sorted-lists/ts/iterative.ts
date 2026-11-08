import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './iterative.driver'

export interface ListNode {
  val: number
  next: ListNode | null
}

export function mergeTwoLists(list1: ListNode | null, list2: ListNode | null, t: Tracer = noop): ListNode | null {
  const dummy: ListNode = { val: 0, next: null } // [1] a fake head, so the first pick is not a special case
  let tail = dummy // [1] the last node of the merged list
  t.step(1, 'Make a fake node D. tail points at it. The merged list will hang off D.', [view(list1, [['list1', list1]], { label: 'list1' }), view(list2, [['list2', list2]], { label: 'list2' }), view(dummy, [['tail', tail, 'hit']], { label: 'merged so far', dummy })])
  while (list1 && list2) {
    let pick: ListNode
    if (list1.val <= list2.val) { // [2] take the smaller front node
      pick = list1
      list1 = list1.next
    } else {
      pick = list2
      list2 = list2.next
    }
    tail.next = pick // [2] link it after tail
    t.step(2, `Compare the two fronts. ${pick.val} is smaller or equal, so link it after tail.`, [view(list1, [['list1', list1]], { label: 'list1' }), view(list2, [['list2', list2]], { label: 'list2' }), view(dummy, [['tail', tail, 'hit']], { label: 'merged so far', dummy, stop: pick, toneOf: (n) => (n === pick ? 'focus' : null) })])
    tail = pick // [3] tail is now the new last node
    t.step(3, `Move tail onto ${pick.val}. The next pick will hang off it.`, [view(list1, [['list1', list1]], { label: 'list1' }), view(list2, [['list2', list2]], { label: 'list2' }), view(dummy, [['tail', tail, 'hit']], { label: 'merged so far', dummy, stop: tail })])
  }
  tail.next = list1 ?? list2 // [4] one list is empty. Hang the other one on as it is
  t.step(4, 'One list ran out. Whatever is left of the other is already sorted, so attach it in one move.', [view(dummy, [['tail', tail, 'hit']], { label: 'merged', dummy })])
  t.step(5, 'Skip the fake node. The answer starts at D.next.', [view(dummy.next, [['head', dummy.next, 'hit']], { label: 'answer', toneOf: () => 'hit' })])
  return dummy.next // [5] skip the fake head
}
