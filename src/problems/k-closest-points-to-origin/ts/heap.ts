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

export interface Entry {
  d: number // squared distance from the origin
  p: number[]
}

export function kClosest(points: number[][], k: number, t: Tracer = noop): number[][] {
  const heap = new Heap<Entry>((a, b) => a.d > b.d) // max-heap: the farthest kept point is on top
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const d = p[0] * p[0] + p[1] * p[1] // [1] squared distance. No sqrt needed to compare
    t.step(1, `Point (${p[0]}, ${p[1]}): ${p[0]}*${p[0]} + ${p[1]}*${p[1]} = ${d}. Skip the square root, the order is the same.`, show(points, heap.items, i))
    heap.push({ d, p }) // [2] keep it for now
    t.step(2, `Push it. The heap holds ${heap.size} point${heap.size === 1 ? '' : 's'}, and the farthest, ${heap.peek().d}, is on top.`, show(points, heap.items, i))
    if (heap.size > k) {
      const far = heap.pop() // [3] more than k: the farthest point cannot be in the answer
      t.step(3, `${k + 1} points is too many. Evict the farthest, (${far.p[0]}, ${far.p[1]}) at ${far.d}.`, show(points, heap.items, i, far))
    }
  }
  t.step(4, `Everything was seen. The ${k} points left in the heap are the closest.`, show(points, heap.items, points.length, undefined, true))
  return heap.items.map((e) => e.p) // [4] the heap holds exactly the k closest
}
