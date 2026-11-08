// Trace-only drawing helpers. Never shown on the page.
import { arr, heap as heapPanel, intervals, type Panel, type Tone } from '../../../core/panels'

export type Phase = 'sorted' | 'push' | 'pop' | 'answer' | 'done'

/**
 * Intervals sorted by start: not pushed yet = keep, in the heap = focus, popped as expired = miss, the heap top while answering = hit.
 * Then the heap (sizes), the queries in their original order (the one being served is in focus) and the answers so far.
 * done = queries fully finished. The current query is order[done].
 */
export function view(sorted: number[][], queries: number[], order: number[], done: number, next: number, items: number[][], answer: number[], phase: Phase): Panel[] {
  const lo = sorted.length > 0 ? Math.min(...sorted.map((s) => s[0])) : 0
  const hi = sorted.length > 0 ? Math.max(...sorted.map((s) => s[1])) : 1
  const cur = phase === 'done' ? -1 : order[done]
  const counts = new Map<string, number>()
  for (const [size, end] of items) counts.set(`${size},${end}`, (counts.get(`${size},${end}`) ?? 0) + 1)
  const top = items.length > 0 ? `${items[0][0]},${items[0][1]}` : ''
  let topTaken = false
  const tones = sorted.map(([start, end], j): Tone | undefined => {
    if (j >= next) return undefined
    const key = `${end - start + 1},${end}`
    const left = counts.get(key) ?? 0
    if (left === 0) return 'miss'
    counts.set(key, left - 1)
    if (phase === 'answer' && key === top && !topTaken) {
      topTaken = true
      return 'hit'
    }
    return 'focus'
  })
  const q = cur >= 0 ? queries[cur] : undefined
  const marks = q === undefined || sorted.length === 0 ? [] : [{ at: Math.min(hi, Math.max(lo, q)), label: `query ${q}` }]
  const shown = new Set(order.slice(0, done))
  if (phase === 'answer' && cur >= 0) shown.add(cur)
  const doneTones = queries.map((_, p): Tone | undefined => (shown.has(p) ? (answer[p] >= 0 ? 'hit' : 'miss') : p === cur ? 'focus' : undefined))
  return [
    intervals(sorted.map(([start, end], j) => ({ start, end, tone: tones[j] })), { label: 'intervals by start. Focus = in the heap, miss = expired', min: lo, max: hi, marks }),
    heapPanel(items.map((x) => x[0]), { label: 'min-heap of sizes. The top is the smallest', tones: items.map((_, k): Tone | null => (k === 0 ? 'focus' : null)) }),
    arr(queries, { label: 'queries, original order', tones: queries.map((_, p): Tone | undefined => (shown.has(p) ? 'dim' : p === cur ? 'focus' : undefined)) }),
    arr(queries.map((_, p) => (shown.has(p) ? answer[p] : '?')), { label: 'answers, same order', tones: doneTones }),
  ]
}
