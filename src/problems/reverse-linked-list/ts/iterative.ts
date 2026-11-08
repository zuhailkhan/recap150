import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { list, listVals } from '../../../core/panels'

export interface ListNode {
  val: number
  next: ListNode | null
}

export function reverseList(head: ListNode | null, t: Tracer = noop): ListNode | null {
  let prev: ListNode | null = null // [1] the reversed part, empty so far
  let cur = head // [1] the node we are about to flip
  t.step(1, 'prev is the reversed part (empty). cur is the next node to flip (the head).', [list(listVals(prev), { label: 'reversed (prev)' }), list(listVals(cur), { label: 'still to do (cur)', pointers: [{ name: 'cur', at: 0 }] })])
  while (cur) {
    const next: ListNode | null = cur.next // [2] remember the rest before cutting the link
    t.step(2, `Save cur.next (${next ? next.val : 'null'}). Once we cut the link we could not find it again.`, [list(listVals(prev), { label: 'reversed (prev)' }), list(listVals(cur), { label: 'still to do (cur)', pointers: [{ name: 'cur', at: 0 }, ...(next ? [{ name: 'next', at: 1, tone: 'keep' as const }] : [])] })])
    cur.next = prev // [3] flip: point this node backwards
    t.step(3, `Flip ${cur.val} so it points back at ${prev ? prev.val : 'null'}.`, [list(listVals(cur), { label: 'reversed, with cur added', tones: listVals(cur).map((_, i) => (i === 0 ? ('focus' as const) : null)) }), list(listVals(next), { label: 'still to do (next)', pointers: [{ name: 'next', at: 0, tone: 'keep' }] })])
    prev = cur // [4] step forward: cur joins the reversed part
    cur = next
    t.step(4, cur ? `Move on. prev is now ${prev.val}, cur is ${cur.val}.` : `Move on. prev is now ${prev.val}, and cur ran off the end.`, [list(listVals(prev), { label: 'reversed (prev)', pointers: [{ name: 'prev', at: 0, tone: 'hit' }] }), list(listVals(cur), { label: 'still to do (cur)', pointers: [{ name: 'cur', at: 0 }] })])
  }
  t.step(5, `cur is null, so every node is flipped. prev is the new head.`, [list(listVals(prev), { label: 'answer', tones: listVals(prev).map(() => 'hit' as const), pointers: [{ name: 'head', at: 0, tone: 'hit' }] })])
  return prev // [5] prev is the new head
}
