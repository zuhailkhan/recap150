import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { relaxSay, show } from './viz'

// JavaScript has no built-in heap. This one keeps [distance, node] pairs with the smallest distance on top.
class MinHeap {
  items: [number, number][] = []

  get size(): number {
    return this.items.length
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

  pop(): [number, number] {
    const a = this.items
    const top = a[0]
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
    return top
  }
}

export function networkDelayTime(times: number[][], n: number, k: number, t: Tracer = noop): number {
  const adj: [number, number][][] = Array.from({ length: n + 1 }, () => [])
  for (const [u, v, w] of times) adj[u].push([v, w])
  const dist = new Array<number>(n + 1).fill(Infinity) // best known time to reach each node
  dist[k] = 0
  const heap = new MinHeap()
  heap.push([0, k]) // [1] start from the source at time 0
  t.step(1, `The signal starts at node ${k} at time 0. Every other node is unknown (inf). The heap holds the one entry we know.`, show(times, n, dist, heap.items, k, 0, 'init'))
  while (heap.size > 0) {
    const [d, u] = heap.pop()! // [2] the closest node we have not finished
    if (d > dist[u]) {
      t.step(2, `Popped node ${u} at ${d}, but we already know ${dist[u]} for it. This is an old entry, so skip it.`, show(times, n, dist, heap.items, u, d, 'stale'))
      continue // stale entry: a shorter way to u was found after this one was pushed
    }
    t.step(2, `Popped node ${u} at time ${d}. Nothing left in the heap is closer, so ${d} is final for node ${u}.`, show(times, n, dist, heap.items, u, d, 'pop'))
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) { // [3] going through u beats what we knew about v
        dist[v] = d + w
        heap.push([dist[v], v])
      }
    }
    t.step(3, relaxSay(times, dist, u, d), show(times, n, dist, heap.items, u, d, 'relax'))
  }
  let worst = 0 // [4] the network is done when the slowest node hears it
  for (let i = 1; i <= n; i++) worst = Math.max(worst, dist[i])
  t.step(4, worst === Infinity ? 'Some node was never reached, so the answer is -1.' : `Every node heard the signal. The slowest one at ${worst} sets the answer.`, show(times, n, dist, heap.items, -1, Infinity, 'done'))
  return worst === Infinity ? -1 : worst
}
