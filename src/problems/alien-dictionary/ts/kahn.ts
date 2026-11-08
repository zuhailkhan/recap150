import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { pairSay, show } from './viz'

export function alienOrder(words: string[], t: Tracer = noop): string {
  const after = new Map<string, Set<string>>() // letter -> letters that must come after it
  for (const w of words) for (const ch of w) if (!after.has(ch)) after.set(ch, new Set()) // [1] every letter counts, even ones with no rule
  t.step(1, `Collect every letter that appears in any word: ${[...after.keys()].join(' ')}. Each is a node. No rules yet.`, show(words, after, { pair: -1 }))
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i]
    const b = words[i + 1]
    if (a.length > b.length && a.startsWith(b)) {
      t.step(2, pairSay(a, b), show(words, after, { pair: i, bad: true }))
      return '' // [2] "abc" before "ab" cannot be sorted by any alphabet
    }
    for (let j = 0; j < Math.min(a.length, b.length); j++) {
      if (a[j] !== b[j]) {
        after.get(a[j])!.add(b[j]) // [2] the first different letters give one rule: a[j] comes before b[j]
        break
      }
    }
    t.step(2, pairSay(a, b), show(words, after, { pair: i }))
  }
  const indegree = new Map<string, number>() // how many rules still point at each letter
  for (const ch of after.keys()) indegree.set(ch, 0)
  for (const set of after.values()) for (const ch of set) indegree.set(ch, indegree.get(ch)! + 1)
  const queue = [...after.keys()].filter((ch) => indegree.get(ch) === 0) // [3] letters that nothing must come before
  t.step(3, queue.length ? `Count the rules pointing at each letter. Letters with 0 can go first: ${queue.join(' ')}.` : 'Count the rules pointing at each letter. No letter has 0, so nothing can go first.', show(words, after, { indegree, queue, head: 0, order: '' }))
  let order = ''
  for (let head = 0; head < queue.length; head++) {
    const ch = queue[head]
    order += ch // [4] output it, then remove its rules so its followers may unlock
    for (const nxt of after.get(ch)!) {
      indegree.set(nxt, indegree.get(nxt)! - 1)
      if (indegree.get(nxt) === 0) queue.push(nxt)
    }
    t.step(4, `Output ${ch}. Its rules are removed, which may unlock letters that were waiting only on it.`, show(words, after, { indegree, queue, head: head + 1, order, cur: ch }))
  }
  t.step(5, order.length === after.size ? `All ${after.size} letters were output, so ${order} is a valid order.` : `Only ${order.length} of ${after.size} letters were output. The rest wait on each other in a cycle, so there is no valid order.`, show(words, after, { indegree, queue, head: queue.length, order, done: true }))
  return order.length === after.size ? order : '' // [5] a cycle leaves letters stuck, so some never get output
}
