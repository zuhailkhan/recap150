import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { findOrder } from './dfs'

/**
 * Many orders can be right, so the test needs a canonical answer: [length, valid].
 * valid is 1 when the order lists every course once and each course comes after its prerequisites.
 * An empty order counts as valid here. The case's expected length (0 or n) tells the two outcomes apart.
 */
export function findOrderDriver(numCourses: number, prerequisites: number[][], t: Tracer = noop): number[] {
  const order = findOrder(numCourses, prerequisites, t)
  if (order.length === 0) return [0, 1]
  const at = new Map<number, number>(order.map((c, i) => [c, i]))
  const permutation = order.length === numCourses && at.size === numCourses && order.every((c) => c >= 0 && c < numCourses)
  const respects = prerequisites.every(([c, p]) => at.has(c) && at.has(p) && at.get(p)! < at.get(c)!)
  return [order.length, permutation && respects ? 1 : 0]
}
