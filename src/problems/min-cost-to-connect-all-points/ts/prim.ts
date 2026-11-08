import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { gain, show } from './viz'

export function minCostConnectPoints(points: number[][], t: Tracer = noop): number {
  const n = points.length
  const dist = new Array<number>(n).fill(Infinity) // cheapest known link from each point to the tree
  const inTree = new Array<boolean>(n).fill(false)
  dist[0] = 0 // [1] the tree starts as point 0 alone
  t.step(1, 'The tree starts as point 0, which costs nothing to add. Every other point has no link to the tree yet (inf).', show(points, dist, inTree, -1, false, true))
  let total = 0
  for (let round = 0; round < n; round++) {
    let u = -1
    for (let i = 0; i < n; i++) if (!inTree[i] && (u === -1 || dist[i] < dist[u])) u = i // [2] the outside point that is cheapest to reach
    inTree[u] = true
    total += dist[u]
    t.step(2, `Point ${u} is the cheapest outside point, at cost ${dist[u]}. Add it to the tree. Total so far: ${total}.`, show(points, dist, inTree, u))
    for (let v = 0; v < n; v++) {
      const d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1])
      if (!inTree[v] && d < dist[v]) dist[v] = d // [3] point u may be a cheaper way in for point v
    }
    t.step(3, gain(points, dist, inTree, u), show(points, dist, inTree, u, false, false, true))
  }
  t.step(4, `Every point is in the tree. The cheapest way to connect them all costs ${total}.`, show(points, dist, inTree, -1, true))
  return total // [4] n points need n-1 links, and we paid for the cheapest ones
}
