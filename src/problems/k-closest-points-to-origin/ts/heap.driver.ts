import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { kClosest } from './heap'

// The answer is a set of points, so the driver sorts it. Tests then compare one fixed order.
export function kClosestDriver(points: number[][], k: number, t: Tracer = noop): number[][] {
  return kClosest(points, k, t).sort((a, b) => a[0] - b[0] || a[1] - b[1])
}
