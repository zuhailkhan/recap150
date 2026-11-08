import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './iterative.driver'

export interface ListNode {
  val: number
  next: ListNode | null
}

export function hasCycle(head: ListNode | null, t: Tracer = noop): boolean {
  let slow = head // [1] two runners start on the same node
  let fast = head
  t.step(1, 'slow and fast both start at the head.', [view(head, [['slow', slow], ['fast', fast, 'keep']], { label: 'list' })])
  while (fast && fast.next) {
    slow = slow!.next // [2] slow walks 1 node
    fast = fast.next.next // [2] fast walks 2 nodes
    t.step(2, `slow moves 1, fast moves 2. slow is on ${slow!.val}, fast is on ${fast ? fast.val : 'nothing (null)'}.`, [view(head, [['slow', slow], ['fast', fast, 'keep']], { label: 'list' })])
    if (slow === fast) { // [3] the same node, not just the same value
      t.step(3, 'Same node! fast lapped slow, which can only happen inside a loop.', [view(head, [['both', slow, 'hit']], { label: 'list', toneOf: (n) => (n === slow ? 'hit' : null) })])
      t.step(4, 'They met, so there is a cycle. Return true.', [view(head, [['meet', slow, 'hit']], { label: 'cycle found', toneOf: (n) => (n === slow ? 'hit' : null) })])
      return true // [4] they met, so there is a cycle
    }
    t.step(3, 'Different nodes. That says nothing yet, so keep running.', [view(head, [['slow', slow], ['fast', fast, 'keep']], { label: 'list' })])
  }
  t.step(4, 'fast ran off the end. A loop has no end, so there is no cycle. Return false.', [view(head, [['slow', slow]], { label: 'no cycle', toneOf: () => 'miss' })])
  return false // [4] fast fell off the end, so the list ends
}
