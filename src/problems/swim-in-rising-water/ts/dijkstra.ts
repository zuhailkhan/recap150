import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

// JavaScript has no built-in heap. This one keeps [level, row, col] with the smallest level on top.
class MinHeap {
  items: [number, number, number][] = []

  get size(): number {
    return this.items.length
  }

  push(x: [number, number, number]): void {
    const a = this.items
    a.push(x)
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1
      if (a[p][0] <= a[i][0]) break
      ;[a[p], a[i]] = [a[i], a[p]]
      i = p
    }
  }

  pop(): [number, number, number] {
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

export function swimInWater(grid: number[][], t: Tracer = noop): number {
  const n = grid.length
  const seen = grid.map((row) => row.map(() => false)) // seen = in the heap or already popped
  const heap = new MinHeap()
  heap.push([grid[0][0], 0, 0]) // [1] a path that is only the start costs the start's height
  seen[0][0] = true
  t.step(1, `Start in the top-left cell. Standing there already needs water level ${grid[0][0]}. Put it in the heap.`, show(grid, seen, heap.items, -1, -1, 0, false))
  while (heap.size > 0) {
    const [level, r, c] = heap.pop()! // [2] the cell reachable with the lowest water level
    t.step(2, `Pop cell (${r},${c}) with level ${level}. No other waiting cell needs less water, so the flood has reached it at level ${level}.`, show(grid, seen, heap.items, r, c, level, false))
    if (r === n - 1 && c === n - 1) {
      t.step(4, `That is the bottom-right cell. The lowest water level that connects the corners is ${level}.`, show(grid, seen, heap.items, r, c, level, true))
      return level // [4] first time the goal comes out is the best
    }
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue
      seen[nr][nc] = true
      heap.push([Math.max(level, grid[nr][nc]), nr, nc]) // [3] reaching it needs the higher of the old level and its own height
    }
    t.step(3, `Add the unseen neighbours of (${r},${c}). Each one costs the larger of ${level} and its own height.`, show(grid, seen, heap.items, r, c, level, false))
  }
  return -1
}
