import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, graph } from '../../../core/panels'

export function findOrder(numCourses: number, prerequisites: number[][], t: Tracer = noop): number[] {
  const needs: number[][] = Array.from({ length: numCourses }, () => []) // [1] needs[c] = courses to finish before c
  for (const [course, pre] of prerequisites) needs[course].push(pre)
  t.step(1, `Each course keeps a list of the courses it needs first. Goal: write the courses in an order where every course comes after its needs.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([c, p]) => ({ from: String(p), to: String(c), directed: true })), { label: 'arrow = must come first' }), arr([], { label: 'order so far' })])

  const state: number[] = Array(numCourses).fill(0) // 0 = unseen, 1 = on the current path, 2 = written down
  const order: number[] = []

  const visit = (c: number): boolean => {
    if (state[c] === 2) { // [4] already written down: nothing to do
      t.step(4, `Course ${c} is already in the order, so it is skipped.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([x, p]) => ({ from: String(p), to: String(x), directed: true })), { label: 'seen again', tones: Object.fromEntries(state.flatMap((s, i) => (s === 0 ? [] : [[String(i), i === c ? 'dim' : s === 1 ? 'keep' : 'hit'] as const]))) }), arr(order, { label: 'order so far' })])
      return true
    }
    if (state[c] === 1) { // [4] reached a course that is still on the path: a cycle
      t.step(4, `Course ${c} is already on the current path, so it needs itself. That is a cycle. No order exists.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([x, p]) => ({ from: String(p), to: String(x), directed: true })), { label: 'cycle found', tones: Object.fromEntries(state.flatMap((s, i) => (s === 0 ? [] : [[String(i), s === 1 ? 'miss' : 'hit'] as const]))) }), arr(order, { label: 'order so far' })])
      return false
    }
    state[c] = 1 // [2] enter c: it is on the current path
    t.step(2, `Enter course ${c}. ${needs[c].length === 0 ? 'It needs nothing, so it can be written down right away.' : `It needs ${needs[c].join(', ')}, so those come first.`}`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([x, p]) => ({ from: String(p), to: String(x), directed: true, tone: x === c ? ('focus' as const) : undefined })), { label: 'on the path = remembered', tones: Object.fromEntries(state.flatMap((s, i) => (s === 0 ? [] : [[String(i), i === c ? 'focus' : s === 1 ? 'keep' : 'hit'] as const]))) }), arr(order, { label: 'order so far' })])
    for (const p of needs[c]) if (!visit(p)) return false
    state[c] = 2 // [3] everything c needs is written: write c
    order.push(c)
    t.step(3, `Everything course ${c} needs is already written. Write ${c} down. Order: ${order.join(', ')}.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([x, p]) => ({ from: String(p), to: String(x), directed: true })), { label: `wrote ${c}`, tones: Object.fromEntries(state.flatMap((s, i) => (s === 0 ? [] : [[String(i), i === c ? 'focus' : s === 1 ? 'keep' : 'hit'] as const]))) }), arr(order, { label: 'order so far', tones: order.map((_, i) => (i === order.length - 1 ? 'focus' : 'hit')) })])
    return true
  }

  for (let c = 0; c < numCourses; c++) if (!visit(c)) return [] // [5] start from every course, give up on a cycle
  t.step(5, `All ${numCourses} courses are written down. This order works.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([x, p]) => ({ from: String(p), to: String(x), directed: true })), { label: 'done', tones: Object.fromEntries(state.map((_, i) => [String(i), 'hit'])) }), arr(order, { label: 'order', tones: order.map(() => 'hit') })])
  return order // [5]
}
