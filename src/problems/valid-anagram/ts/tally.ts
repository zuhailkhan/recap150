import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, cursor, fromMap } from '../../../core/panels'

export function isAnagram(s: string, w: string, t: Tracer = noop): boolean {
  if (s.length !== w.length) { // [1] different lengths can never match
    t.step(1, `"${s}" has ${s.length} letters and "${w}" has ${w.length}. Different lengths, so they cannot be anagrams.`, [arr([...s], { label: 's' }), arr([...w], { label: 'w' })])
    return false
  }
  const count = new Map<string, number>() // [1] letter -> how many more times s used it than w so far
  t.step(1, 'Same length. Start with an empty tally. Letters of s will add to it, letters of w will take from it.', [arr([...s], { label: 's' }), arr([...w], { label: 'w' }), buckets([], { label: 'tally', keyLabel: 'letter → count', empty: 'empty' })])
  for (let i = 0; i < s.length; i++) {
    count.set(s[i], (count.get(s[i]) ?? 0) + 1) // [2] count up with the letters of s
    t.step(2, `Letter "${s[i]}" of s. Add one to its count: now ${count.get(s[i])}.`, [arr([...s], { label: 's', tones: cursor(s.length, i), pointers: [{ name: 'i', at: i }] }), arr([...w], { label: 'w' }), buckets(fromMap(count, s[i]), { label: 'tally', keyLabel: 'letter → count' })])
  }
  for (let i = 0; i < w.length; i++) {
    const left = (count.get(w[i]) ?? 0) - 1
    count.set(w[i], left) // [3] count down with the letters of w
    if (left < 0) { // [3] w used a letter more often than s had it
      t.step(3, `Letter "${w[i]}" of w. Its count would drop to ${left}. w has more "${w[i]}" than s. Not an anagram.`, [arr([...s], { label: 's', tones: [...s].map(() => 'dim' as const) }), arr([...w], { label: 'w', tones: cursor(w.length, i).map((x, k) => (k === i ? 'miss' : x)), pointers: [{ name: 'i', at: i, tone: 'miss' }] }), buckets(fromMap(count, w[i]).map((x) => (x.tone ? { ...x, tone: 'miss' as const } : x)), { label: 'tally', keyLabel: 'letter → count' })])
      return false
    }
    t.step(3, `Letter "${w[i]}" of w. Take one away: now ${left}.`, [arr([...s], { label: 's', tones: [...s].map(() => 'dim' as const) }), arr([...w], { label: 'w', tones: cursor(w.length, i), pointers: [{ name: 'i', at: i }] }), buckets(fromMap(count, w[i]), { label: 'tally', keyLabel: 'letter → count' })])
  }
  t.step(4, 'Every letter of w found a partner and the lengths match, so every count is back to 0. It is an anagram.', [arr([...s], { label: 's', tones: [...s].map(() => 'hit' as const) }), arr([...w], { label: 'w', tones: [...w].map(() => 'hit' as const) }), buckets([...count].map(([k, v]) => ({ key: k, items: [v], tone: 'hit' as const })), { label: 'tally', keyLabel: 'letter → count' })])
  return true // [4] equal lengths and no count went negative, so all are zero
}
