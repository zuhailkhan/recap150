import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

// JavaScript has no built-in heap, so here is a small min-heap of [size, end] pairs ordered by size.
export class MinHeap {
  items: [number, number][] = []

  get size(): number {
    return this.items.length
  }

  top(): [number, number] {
    return this.items[0]
  }

  push(x: [number, number]): void {
    const a = this.items
    a.push(x)
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1
      if (a[p][0] <= a[i][0]) break
      ;[a[p], a[i]] = [a[i], a[p]]
      i = p
    }
  }

  pop(): void {
    const a = this.items
    const last = a.pop()!
    if (a.length > 0) {
      a[0] = last
      for (let i = 0; ; ) {
        let m = i
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < a.length && a[c][0] < a[m][0]) m = c
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
  }
}

export function minInterval(intervals: number[][], queries: number[], t: Tracer = noop): number[] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]) // [1] a copy, by start
  const order = queries.map((_, i) => i).sort((a, b) => queries[a] - queries[b]) // [1] positions of the queries, smallest query first
  const answer: number[] = new Array(queries.length).fill(-1)
  const heap = new MinHeap()
  let next = 0
  t.step(1, `Sort the intervals by start. Visit the queries smallest first, but remember each one's original position.`, view(sorted, queries, order, 0, 0, heap.items, answer, 'sorted'))
  for (let k = 0; k < order.length; k++) {
    const q = queries[order[k]]
    const before = next
    while (next < sorted.length && sorted[next][0] <= q) { // [2] every interval that has started by q is a candidate
      heap.push([sorted[next][1] - sorted[next][0] + 1, sorted[next][1]]) // size counts both ends
      next++
    }
    t.step(2, `Query ${q}: push the ${next - before} interval(s) that start at or before ${q}, keyed by size.`, view(sorted, queries, order, k, next, heap.items, answer, 'push'))
    while (heap.size > 0 && heap.top()[1] < q) { // [3] the smallest one ends before q, so it is useless now and for every later query
      const [size, end] = heap.top()
      heap.pop()
      t.step(3, `The top (size ${size}) ends at ${end}, before ${q}. Pop it for good.`, view(sorted, queries, order, k, next, heap.items, answer, 'pop'))
    }
    answer[order[k]] = heap.size > 0 ? heap.top()[0] : -1 // [4] the top is the smallest interval that still covers q; -1 if none
    t.step(4, answer[order[k]] === -1 ? `The heap is empty, so no interval covers ${q}. Answer -1.` : `The top has size ${answer[order[k]]} and still reaches ${q}. That is the answer for ${q}.`, view(sorted, queries, order, k, next, heap.items, answer, 'answer'))
  }
  t.step(5, `Every query is answered, and the answers sit at their original positions.`, view(sorted, queries, order, order.length, next, heap.items, answer, 'done'))
  return answer // [5]
}
