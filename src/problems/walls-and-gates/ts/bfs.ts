import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid } from '../../../core/panels'

const INF = 2147483647 // an empty room no gate has reached yet
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]

// rooms: -1 = wall, 0 = gate, INF = empty room. Returns a grid where each room holds its distance to the nearest gate.
export function wallsAndGates(rooms: number[][], t: Tracer = noop): number[][] {
  const out = rooms.map((row) => [...row]) // copy so the input stays as it was
  let queue: number[][] = []
  for (let r = 0; r < out.length; r++) {
    for (let c = 0; c < out[r].length; c++) {
      if (out[r][c] === 0) queue.push([r, c]) // [1] every gate starts the spread at distance 0
    }
  }
  t.step(1, `${queue.length} gate${queue.length === 1 ? '' : 's'} start together at distance 0. Every empty room still shows ∞.`, [grid(out.map((row) => row.map((v) => (v === INF ? '∞' : v))), { label: 'distance 0: gates (∞ = empty room, -1 = wall)', tones: out.map((row) => row.map((v) => (v === 0 ? 'focus' : v === -1 ? 'dim' : null))) })])

  let d = 0
  while (queue.length > 0) {
    d++
    const next: number[][] = []
    for (const [r, c] of queue) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nr >= out.length || nc < 0 || nc >= out[nr].length) continue // off the grid
        if (out[nr][nc] !== INF) continue // [2] a wall, a gate, or a room that a closer gate already reached
        out[nr][nc] = d // [2] first visit is the shortest distance, because waves go outward one step at a time
        next.push([nr, nc])
      }
    }
    queue = next
    t.step(2, next.length > 0 ? `Distance ${d}: ${next.length} empty room${next.length === 1 ? '' : 's'} are one step from a room at distance ${d - 1}.` : `Nothing new at distance ${d}. The spread is over.`, [grid(out.map((row) => row.map((v) => (v === INF ? '∞' : v))), { label: `distance ${d}`, tones: out.map((row, i) => row.map((v, j) => (v === -1 ? 'dim' : v === INF ? null : next.some(([a, b]) => a === i && b === j) ? 'focus' : 'keep'))) })])
  }

  const lost = out.flat().filter((v) => v === INF).length
  t.step(3, lost === 0 ? 'Every empty room now holds its distance to the nearest gate.' : `${lost} room${lost === 1 ? '' : 's'} no gate can reach stay at ∞.`, [grid(out.map((row) => row.map((v) => (v === INF ? '∞' : v))), { label: 'result', tones: out.map((row) => row.map((v) => (v === INF ? 'miss' : v === -1 ? 'dim' : v === 0 ? 'keep' : 'hit'))) })])
  return out // [3] unreachable rooms keep INF
}
