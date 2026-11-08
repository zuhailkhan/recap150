// Trace-only drawing helpers. Never shown on the page.
import { arr, buckets, heap, type Panel, type Tone } from '../../../core/panels'
import type { Candidate, Tweet, Twitter } from './heap'

const cell = (w: Tweet): string => `${w.id} (t${w.time})`
const MAX_USERS = 5

/** Everyone's tweets, oldest first, and who follows whom. hot is the user that just acted. */
export function world(tw: Twitter, hot: number): Panel[] {
  const users = [...tw.tweets.keys()].slice(0, MAX_USERS)
  const panels: Panel[] = [buckets(users.map((u) => ({ key: `user ${u}`, items: tw.tweets.get(u)!.map(cell), tone: u === hot ? ('focus' as Tone) : undefined })), { label: 'tweets per user: id (time posted), oldest first', empty: 'no tweets yet' })]
  const rows = [...tw.follows].filter(([, s]) => s.size > 0).slice(0, MAX_USERS)
  if (rows.length) panels.push(buckets(rows.map(([u, s]) => ({ key: `user ${u} follows`, items: [...s], tone: u === hot ? ('focus' as Tone) : undefined })), { label: 'who follows whom' }))
  return panels
}

/** The merge: each person's tweets (green = already in the feed, keep = in the heap now), the heap, and the feed. */
export function feedView(tw: Twitter, people: Set<number>, items: Candidate[], feed: number[], hot?: Tweet): Panel[] {
  const users = [...people].slice(0, MAX_USERS)
  const inHeap = new Set(items.map((c) => `${c.user}:${c.at}`))
  const rows = users.map((u) => {
    const mine = tw.tweets.get(u) ?? []
    return { key: `user ${u}`, items: mine.map(cell), itemTones: mine.map((w, i): Tone | null => (hot && w.time === hot.time ? 'focus' : feed.includes(w.id) ? 'hit' : inHeap.has(`${u}:${i}`) ? 'keep' : null)) }
  })
  return [
    buckets(rows, { label: 'tweets per user, oldest first. green = in the feed, blue = candidate in the heap, yellow = just moved', empty: 'nobody to read' }),
    heap(items.map((c) => c.time), { max: true, label: 'heap of candidates, by time posted (t). The newest, the biggest t, is on top', tones: items.map((_, i): Tone | null => (i === 0 ? 'focus' : null)) }),
    arr(feed, { label: 'news feed so far, newest first', tones: feed.map((): Tone => 'hit') }),
  ]
}
