import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

// JavaScript has no built-in heap. This small one keeps the item that wins less(a, b) on top.
export class Heap<T> {
  items: T[] = []
  less: (a: T, b: T) => boolean

  constructor(less: (a: T, b: T) => boolean) {
    this.less = less
  }

  get size(): number {
    return this.items.length
  }

  peek(): T {
    return this.items[0]
  }

  push(x: T): void {
    const a = this.items
    a.push(x)
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1
      if (!this.less(a[i], a[p])) break
      ;[a[i], a[p]] = [a[p], a[i]]
      i = p
    }
  }

  pop(): T {
    const a = this.items
    const top = a[0]
    const last = a.pop()!
    if (a.length > 0) {
      a[0] = last
      for (let i = 0; ; ) {
        let m = i
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < a.length && this.less(a[c], a[m])) m = c
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

export function findKthLargest(nums: number[], k: number, t: Tracer = noop): number {
  const heap = new Heap<number>((a, b) => a < b) // [1] min-heap: the smallest kept number is on top
  t.step(1, `An empty min-heap. It will hold only the ${k} biggest numbers seen so far.`, show(heap.items, k))
  for (const x of nums) {
    heap.push(x) // [2] every number goes in first
    t.step(2, `Push ${x}. The heap holds ${heap.size} number${heap.size === 1 ? '' : 's'}.`, show(heap.items, k, x))
    if (heap.size > k) {
      const out = heap.pop() // [3] one too many: the smallest cannot be the kth largest
      t.step(3, `${k + 1} is one too many. Pop the smallest, ${out}. It is not among the ${k} biggest.`, show(heap.items, k, undefined, 'focus', out))
    }
  }
  t.step(4, `All numbers seen. The top, ${heap.peek()}, is the smallest of the ${k} biggest, so it is the answer.`, show(heap.items, k, heap.peek(), 'hit'))
  return heap.peek() // [4] the top is the kth largest
}
