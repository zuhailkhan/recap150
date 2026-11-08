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

export function lastStoneWeight(stones: number[], t: Tracer = noop): number {
  const heap = new Heap<number>((a, b) => a > b) // max-heap: the heaviest stone is on top
  for (const s of stones) heap.push(s) // [1] put every stone in the heap
  t.step(1, `Put all ${stones.length} stones in a max-heap. The heaviest is always on top.`, show(heap.items))
  while (heap.size > 1) {
    const y = heap.pop() // [2] the two heaviest stones
    const x = heap.pop()
    t.step(2, `Take the two heaviest stones: ${y} and ${x}. Smash them together.`, show(heap.items, [y, x]))
    if (y > x) heap.push(y - x) // [3] the heavier one survives with what is left over
    t.step(3, y > x ? `${y} - ${x} = ${y - x}. The leftover stone goes back in the heap.` : `Equal weights, so both stones vanish.`, show(heap.items, [y, x], y - x))
  }
  t.step(4, heap.size ? `One stone is left, weighing ${heap.peek()}.` : 'No stones are left, so the answer is 0.', show(heap.items, undefined, undefined, true))
  return heap.size ? heap.peek() : 0 // [4] zero or one stone remains
}
