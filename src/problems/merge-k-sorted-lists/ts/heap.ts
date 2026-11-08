import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

export interface ListNode {
  val: number
  next: ListNode | null
}

// JavaScript has no built-in heap, so here is a small min-heap of nodes ordered by val.
export class MinHeap {
  items: ListNode[] = []

  get size(): number {
    return this.items.length
  }

  push(node: ListNode): void {
    const a = this.items
    a.push(node)
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1
      if (a[p].val <= a[i].val) break
      ;[a[p], a[i]] = [a[i], a[p]]
      i = p
    }
  }

  pop(): ListNode {
    const a = this.items
    const top = a[0]
    const last = a.pop()!
    if (a.length > 0) {
      a[0] = last
      for (let i = 0; ; ) {
        let m = i
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < a.length && a[c].val < a[m].val) m = c
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

export function mergeKLists(lists: (ListNode | null)[], t: Tracer = noop): ListNode | null {
  const heap = new MinHeap()
  for (const head of lists) if (head) heap.push(head) // [1] the heap holds one candidate per list: its current head
  const dummy: ListNode = { val: 0, next: null }
  let tail = dummy
  t.step(1, `Put the head of each non-empty list in a min-heap. The smallest head is always on top.`, show(heap, dummy, tail))
  while (heap.size > 0) {
    const node = heap.pop() // [2] the smallest head overall is the next output value
    tail.next = node
    tail = node
    t.step(2, `Pop ${node.val} from the heap and append it to the answer. Its list's next node is not in the heap yet.`, show(heap, dummy, tail))
    if (node.next) {
      heap.push(node.next) // [3] that list's next node becomes its new candidate
      t.step(3, `Push ${node.next.val}, the next node of the list ${node.val} came from.`, show(heap, dummy, tail))
    }
  }
  t.step(4, 'The heap is empty, so every node has been placed. The answer is the chain after the dummy.', show(heap, dummy, tail, true))
  return dummy.next // [4] skip the dummy
}
