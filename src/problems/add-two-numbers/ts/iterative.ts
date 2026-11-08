import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, list, listVals } from '../../../core/panels'

export interface ListNode {
  val: number
  next: ListNode | null
}

export function addTwoNumbers(l1: ListNode | null, l2: ListNode | null, t: Tracer = noop): ListNode | null {
  const dummy: ListNode = { val: 0, next: null } // [1] a fake head for the answer
  let tail = dummy // [1] the last node of the answer
  let carry = 0 // [1] what we carry to the next column
  t.step(1, 'Digits are stored from the ones place up. Start with an empty answer and carry 0.', [list(listVals(l1), { label: 'l1', pointers: [{ name: 'l1', at: 0 }] }), list(listVals(l2), { label: 'l2', pointers: [{ name: 'l2', at: 0 }] }), arr([carry], { label: 'carry' })])
  while (l1 || l2 || carry) {
    const sum = (l1?.val ?? 0) + (l2?.val ?? 0) + carry // [2] one column: digit + digit + carry
    t.step(2, `Add the column: ${l1 ? l1.val : 0} + ${l2 ? l2.val : 0} + carry ${carry} = ${sum}.`, [list(listVals(l1), { label: 'l1 (digits left)', tones: listVals(l1).map((_, i) => (i === 0 ? 'focus' : null)) }), list(listVals(l2), { label: 'l2 (digits left)', tones: listVals(l2).map((_, i) => (i === 0 ? 'focus' : null)) }), list(listVals(dummy.next), { label: 'answer so far' })])
    carry = Math.floor(sum / 10) // [3] the tens part carries on
    tail.next = { val: sum % 10, next: null } // [3] the ones part is the digit we keep
    tail = tail.next
    t.step(3, `Keep digit ${tail.val}. Carry ${carry} to the next column.`, [list(listVals(dummy.next), { label: 'answer so far', tones: listVals(dummy.next).map((_, i, a) => (i === a.length - 1 ? 'hit' : null)) }), arr([carry], { label: 'carry', tones: [carry ? 'keep' : null] })])
    l1 = l1?.next ?? null // [4] move to the next column
    l2 = l2?.next ?? null
    t.step(4, l1 || l2 || carry ? 'Move both lists to the next digit.' : 'No digits and no carry left. We are done.', [list(listVals(l1), { label: 'l1 (digits left)', pointers: l1 ? [{ name: 'l1', at: 0 }] : [] }), list(listVals(l2), { label: 'l2 (digits left)', pointers: l2 ? [{ name: 'l2', at: 0 }] : [] }), list(listVals(dummy.next), { label: 'answer so far' })])
  }
  t.step(5, 'The answer is also stored from the ones place up. Return D.next.', [list(listVals(dummy.next), { label: 'answer', tones: listVals(dummy.next).map(() => 'hit' as const), pointers: [{ name: 'head', at: 0, tone: 'hit' }] })])
  return dummy.next // [5] skip the fake head
}
