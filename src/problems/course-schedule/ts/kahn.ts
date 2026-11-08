import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, graph } from '../../../core/panels'

export function canFinish(numCourses: number, prerequisites: number[][], t: Tracer = noop): boolean {
  const next: number[][] = Array.from({ length: numCourses }, () => []) // [1] next[a] = courses that a unlocks
  const indeg: number[] = Array(numCourses).fill(0) // [1] prerequisites each course still waits for
  for (const [course, pre] of prerequisites) {
    next[pre].push(course) // [1] arrow: pre -> course
    indeg[course]++
  }
  t.step(1, `${prerequisites.length} prerequisite pairs become arrows. Under each course is its in-degree: how many courses must come first.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([c, p]) => ({ from: String(p), to: String(c), directed: true })), { label: 'arrow = must come first', notes: Object.fromEntries(indeg.map((d, i) => [String(i), `in ${d}`])) })])

  const queue: number[] = []
  for (let c = 0; c < numCourses; c++) if (indeg[c] === 0) queue.push(c) // [2] nothing blocks these
  t.step(2, queue.length === 0 ? 'Every course waits for another one. There is nothing to start with.' : `Courses with in-degree 0 can start right away: ${queue.join(', ')}. They form the queue.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([c, p]) => ({ from: String(p), to: String(c), directed: true })), { label: 'in-degree 0 = ready', tones: Object.fromEntries(queue.map((q) => [String(q), 'keep' as const])), notes: Object.fromEntries(indeg.map((d, i) => [String(i), `in ${d}`])) }), arr(queue, { label: 'queue, front on the left' })])

  for (let head = 0; head < queue.length; head++) {
    const c = queue[head] // [3] take a ready course: it is done
    t.step(3, `Take course ${c} from the queue and finish it. ${head + 1} done so far.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([x, p]) => ({ from: String(p), to: String(x), directed: true, tone: p === c ? ('focus' as const) : undefined })), { label: `finish ${c}`, tones: Object.fromEntries(queue.map((q, k) => [String(q), k < head ? 'dim' : k === head ? 'focus' : 'keep'])), notes: Object.fromEntries(indeg.map((d, i) => [String(i), `in ${d}`])) }), arr(queue.slice(head), { label: 'queue, front on the left' })])
    for (const x of next[c]) {
      indeg[x]-- // [4] c is done, so x waits for one less course
      if (indeg[x] === 0) queue.push(x) // [4] x is now free: queue it
    }
    t.step(4, next[c].length === 0 ? `Course ${c} unlocks nothing, so no in-degree changes.` : `Finishing ${c} lowers the in-degree of ${next[c].join(', ')}. ${next[c].filter((x) => indeg[x] === 0).length === 0 ? 'None reached 0 yet.' : `Now free and queued: ${next[c].filter((x) => indeg[x] === 0).join(', ')}.`}`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([x, p]) => ({ from: String(p), to: String(x), directed: true, tone: p === c ? ('focus' as const) : undefined })), { label: 'in-degrees updated', tones: Object.fromEntries(queue.map((q, k) => [String(q), k <= head ? 'dim' : 'keep'])), notes: Object.fromEntries(indeg.map((d, i) => [String(i), `in ${d}`])) }), arr(queue.slice(head + 1), { label: 'queue, front on the left' })])
  }
  t.step(5, queue.length === numCourses ? `All ${numCourses} courses got finished. There is a valid order.` : `Only ${queue.length} of ${numCourses} courses could be finished. The rest wait on each other in a cycle.`, [graph(Array.from({ length: numCourses }, (_, i) => i), prerequisites.map(([x, p]) => ({ from: String(p), to: String(x), directed: true })), { label: queue.length === numCourses ? 'every course finished' : 'red courses are stuck', tones: Object.fromEntries(indeg.map((d, i) => [String(i), queue.length === numCourses ? 'hit' : d > 0 ? 'miss' : 'dim'])), notes: Object.fromEntries(indeg.map((d, i) => [String(i), `in ${d}`])) })])
  return queue.length === numCourses // [5] every course was queued once: no cycle
}
