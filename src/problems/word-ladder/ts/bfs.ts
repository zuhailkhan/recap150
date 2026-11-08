import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { buckets } from '../../../core/panels'

export function ladderLength(beginWord: string, endWord: string, wordList: string[], t: Tracer = noop): number {
  const groups = new Map<string, string[]>() // [1] pattern -> words that fit it, like h*t -> hot
  for (const w of wordList) {
    for (let i = 0; i < w.length; i++) {
      const pattern = w.slice(0, i) + '*' + w.slice(i + 1) // [1] hide one letter
      if (!groups.has(pattern)) groups.set(pattern, [])
      groups.get(pattern)!.push(w)
    }
  }
  t.step(1, `Hide one letter of every list word to get patterns. Words sharing a pattern differ by one letter. Showing patterns with 2 or more words.`, [buckets([...groups].filter(([, ws]) => ws.length > 1).map(([k, ws]) => ({ key: k, items: ws })), { label: 'pattern buckets', keyLabel: 'pattern' })])

  const dist = new Map<string, number>([[beginWord, 1]]) // [2] words reached so far, and the length of the ladder to each
  const queue = [beginWord]
  t.step(2, `Start from "${beginWord}". The ladder so far has length 1. A queue gives shortest paths first, one layer at a time.`, [buckets([...groups].filter(([, ws]) => ws.length > 1).map(([k, ws]) => ({ key: k, items: ws })), { label: 'pattern buckets', keyLabel: 'pattern' }), buckets([{ key: '1', items: [beginWord], itemTones: ['focus'] }], { label: 'BFS layers', keyLabel: 'length' })])

  for (let head = 0; head < queue.length; head++) {
    const word = queue[head] // [3] take the oldest word and read its patterns
    const length = dist.get(word)!
    const added: string[] = []
    t.step(3, `Take "${word}" (length ${length}). Its patterns: ${[...word].map((_, i) => word.slice(0, i) + '*' + word.slice(i + 1)).join(', ')}. Look up the words in those buckets.`, [buckets([...groups].filter(([k, ws]) => ws.length > 1 || [...word].some((_, i) => word.slice(0, i) + '*' + word.slice(i + 1) === k)).map(([k, ws]) => ({ key: k, items: ws, tone: [...word].some((_, i) => word.slice(0, i) + '*' + word.slice(i + 1) === k) ? ('focus' as const) : undefined })), { label: 'buckets of this word are lit', keyLabel: 'pattern' }), buckets([...new Set(dist.values())].map((d) => { const ws = [...dist].filter(([, v]) => v === d).map(([w]) => w); return { key: String(d), items: ws, itemTones: ws.map((w) => (w === word ? 'focus' : queue.indexOf(w) < head ? 'dim' : 'keep')) } }), { label: 'BFS layers', keyLabel: 'length' })])
    for (let i = 0; i < word.length; i++) {
      const pattern = word.slice(0, i) + '*' + word.slice(i + 1) // [3] same patterns as when the buckets were built
      for (const next of groups.get(pattern) ?? []) { // [4] every word in the bucket differs by one letter
        if (next === endWord) { // [5] found the end word: the ladder is one longer
          t.step(5, `"${next}" is the end word and sits one letter away from "${word}". Ladder length ${length} + 1 = ${length + 1}.`, [buckets([...new Set(dist.values())].map((d) => { const ws = [...dist].filter(([, v]) => v === d).map(([w]) => w); return { key: String(d), items: ws, itemTones: ws.map((w) => (w === word ? 'hit' : 'dim')) } }).concat([{ key: String(length + 1), items: [next], itemTones: ['hit'] }]), { label: 'BFS layers', keyLabel: 'length' })])
          return length + 1
        }
        if (!dist.has(next)) { // [4] a new word: record its length and queue it
          dist.set(next, length + 1)
          queue.push(next)
          added.push(next)
        }
      }
    }
    t.step(4, added.length === 0 ? `Every word one letter from "${word}" was already reached. Nothing to queue.` : `New words one letter from "${word}": ${added.join(', ')}. Each gets length ${length + 1} and joins the queue. Words already reached are skipped.`, [buckets([...new Set(dist.values())].map((d) => { const ws = [...dist].filter(([, v]) => v === d).map(([w]) => w); return { key: String(d), items: ws, itemTones: ws.map((w) => (added.includes(w) ? 'focus' : queue.indexOf(w) <= head ? 'dim' : 'keep')) } }), { label: 'BFS layers', keyLabel: 'length' })])
  }
  t.step(5, `The queue ran dry and "${endWord}" was never reached, so no ladder exists. Answer 0.`, [buckets([...new Set(dist.values())].map((d) => { const ws = [...dist].filter(([, v]) => v === d).map(([w]) => w); return { key: String(d), items: ws, itemTones: ws.map(() => 'miss' as const) } }), { label: 'every reachable word, none is the end', keyLabel: 'length' })])
  return 0 // [5] no more words to explore: unreachable
}
