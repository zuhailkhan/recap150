import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { plot } from './viz'

export class DetectSquares {
  private copies = new Map<string, number>() // "x,y" -> how many copies of that point
  private pts: number[][] = [] // every point added, repeats included

  add(point: number[], t: Tracer = noop): void {
    const [x, y] = point
    const key = `${x},${y}`
    this.copies.set(key, (this.copies.get(key) ?? 0) + 1) // [1] one more copy of this point
    this.pts.push(point) // [1] and remember it as a possible opposite corner
    t.step(1, `add(${x}, ${y}): the map now holds ${this.copies.get(key)} cop${this.copies.get(key) === 1 ? 'y' : 'ies'} of this point.`, [plot(this.copies)])
  }

  count(point: number[], t: Tracer = noop): number {
    const [qx, qy] = point
    let total = 0
    t.step(2, `count(${qx}, ${qy}): try every stored point as the corner opposite the query. Only a point equally far across and up works.`, [plot(this.copies, { query: point })])
    for (const [px, py] of this.pts) { // [2] each stored point could be the opposite corner
      if (Math.abs(px - qx) !== Math.abs(py - qy) || px === qx) continue // [2] needs equal, non-zero distance across and up
      const a = this.copies.get(`${qx},${py}`) ?? 0 // [3] the corner straight above or below the query
      const b = this.copies.get(`${px},${qy}`) ?? 0 // [3] the corner straight beside the query
      total += a * b // [3] every pairing of copies is one square
      t.step(3, `(${px}, ${py}) is on the diagonal. The other corners are (${qx}, ${py}) with ${a} cop${a === 1 ? 'y' : 'ies'} and (${px}, ${qy}) with ${b}. That adds ${a} x ${b} = ${a * b} square${a * b === 1 ? '' : 's'}.`, [plot(this.copies, { query: point, cand: [px, py], corners: [[qx, py], [px, qy]] })])
    }
    t.step(4, `No more stored points to try. The query completes ${total} square${total === 1 ? '' : 's'}.`, [plot(this.copies, { query: point })])
    return total // [4] the sum over all opposite corners
  }
}
