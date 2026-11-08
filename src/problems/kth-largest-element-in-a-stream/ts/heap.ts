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

export class KthLargest {
  k: number
  heap = new Heap<number>((a, b) => a < b) // min-heap: the smallest kept number is on top

  constructor(k: number, nums: number[], t: Tracer = noop) {
    this.k = k
    for (const x of nums) this.add(x) // [1] start with the numbers we were given
    t.step(1, `Feed the starting numbers in. The heap keeps only the ${k} biggest. Its top is number ${k} counting from the biggest.`, show(this.heap.items, k, this.heap.peek(), 'hit'))
  }

  add(val: number, t: Tracer = noop): number {
    this.heap.push(val) // [2] every new number goes in first
    t.step(2, `add(${val}): push ${val} into the heap. It now holds ${this.heap.size} numbers.`, show(this.heap.items, this.k, val))
    if (this.heap.size > this.k) {
      const out = this.heap.pop() // [3] one too many: the smallest cannot be the kth largest
      t.step(3, `${this.k + 1} is one too many. Pop the smallest, ${out}. Nothing below the top can matter now.`, show(this.heap.items, this.k, undefined, 'focus', out))
    }
    t.step(4, `The top is ${this.heap.peek()}. That is number ${this.k} counting from the biggest, so it is the answer.`, show(this.heap.items, this.k, this.heap.peek(), 'hit'))
    return this.heap.peek() // [4] the top is the answer
  }
}
