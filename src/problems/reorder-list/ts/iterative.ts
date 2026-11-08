import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './iterative.driver'

export interface ListNode {
  val: number
  next: ListNode | null
}

export function reorderList(head: ListNode | null, t: Tracer = noop): void {
  if (!head || !head.next) return
  let slow = head // [1] slow takes one step, fast takes two
  let fast: ListNode | null = head.next // [1] fast starts one ahead, so slow ends on the end of the first half
  t.step(1, 'Both pointers start at the front. fast is one node ahead.', [view(head, [['slow', slow], ['fast', fast, 'keep']], { label: 'list' })])
  while (fast && fast.next) {
    slow = slow.next!
    fast = fast.next.next
    t.step(1, `slow moves 1, fast moves 2. When fast hits the end, slow is at the middle. Now slow is ${slow.val}.`, [view(head, [['slow', slow], ['fast', fast, 'keep']], { label: 'list' })])
  }
  let prev: ListNode | null = null // [2] reverse the second half in place
  let cur = slow.next // [2] second half starts after slow
  slow.next = null // [2] cut the list in two
  t.step(2, `Cut after ${slow.val}. Now there are two lists: the first half and the second half.`, [view(head, [['slow', slow]], { label: 'first half' }), view(cur, [['cur', cur]], { label: 'second half (cur)' })])
  while (cur) {
    const next: ListNode | null = cur.next
    cur.next = prev
    prev = cur
    cur = next
    t.step(2, `Flip one arrow of the second half. prev is now ${prev.val}.`, [view(head, [['slow', slow]], { label: 'first half' }), view(prev, [['prev', prev, 'hit']], { label: 'second half, reversed so far' }), view(cur, [['cur', cur]], { label: 'still to flip' })])
  }
  let first: ListNode | null = head // [3] weave: one from the front, one from the back
  let second = prev // [3] the reversed second half starts at its old tail
  while (first && second) {
    const n1: ListNode | null = first.next
    const n2: ListNode | null = second.next
    first.next = second // [3] first -> second
    second.next = n1 // [3] second -> the rest of the first half
    t.step(3, `Put ${second.val} right after ${first.val}.`, [view(head, [['first', first, 'focus'], ['second', second, 'hit']], { label: 'list being woven', toneOf: (n) => (n === first || n === second ? 'hit' : null) }), view(n2, [['next', n2]], { label: 'second half still to place' })])
    first = n1
    second = n2
  }
  t.step(3, 'Both halves are used up. The list is in the new order.', [view(head, [['head', head, 'hit']], { label: 'reordered', toneOf: () => 'hit' })])
}
