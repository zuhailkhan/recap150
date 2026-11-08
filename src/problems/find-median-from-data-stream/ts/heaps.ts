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

export class MedianFinder {
  lower = new Heap<number>((a, b) => a > b) // [1] max-heap: the smaller half. Its top is the biggest of the small numbers
  upper = new Heap<number>((a, b) => a < b) // [1] min-heap: the bigger half. Its top is the smallest of the big numbers

  addNum(num: number, t: Tracer = noop): void {
    this.lower.push(num) // [2] the new number enters the lower half first
    this.upper.push(this.lower.pop()) // [2] then the lower half's biggest crosses over, so every lower number is <= every upper number
    t.step(2, `addNum(${num}): ${num} goes into the lower half, then the biggest lower number crosses to the upper half. Lower is now ${this.lower.size} big, upper ${this.upper.size}.`, show(this.lower.items, this.upper.items, 'focus'))
    if (this.upper.size > this.lower.size) {
      this.lower.push(this.upper.pop()) // [3] keep the halves balanced: lower may hold one extra, never upper
      t.step(3, `Upper is bigger than lower. Move the smallest upper number back down, so the sizes are ${this.lower.size} and ${this.upper.size}.`, show(this.lower.items, this.upper.items, 'focus'))
    }
  }

  findMedian(): number {
    if (this.lower.size > this.upper.size) return this.lower.peek() // [4] odd count: the extra number on top of the lower half
    return (this.lower.peek() + this.upper.peek()) / 2 // [4] even count: the mean of both tops
  }
}
