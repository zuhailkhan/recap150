import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets } from '../../../core/panels'
import { partTones } from './viz'

export function partitionLabels(s: string, t: Tracer = noop): number[] {
  const last = new Map<string, number>() // [1] letter -> index of its last occurrence
  for (let i = 0; i < s.length; i++) last.set(s[i], i)
  const chars = [...s]
  t.step(1, `Record where each letter appears for the last time. A part must reach at least that far to keep the letter in one piece.`, [arr(chars, { label: 'string' }), buckets([...last].map(([k, v]) => ({ key: k, items: [v] })), { label: 'last index of each letter', keyLabel: 'letter' })])
  const sizes: number[] = []
  let start = 0 // where the current part began
  let end = 0 // [2] the farthest last occurrence of any letter in the current part
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last.get(s[i])!) // [2] this letter drags the part's end out to its last occurrence
    t.step(2, `"${s[i]}" last appears at ${last.get(s[i])}. The part must run at least to ${end}, or "${s[i]}" would be split.`, [arr(chars, { label: 'string (bracket = current part, up to end)', tones: partTones(s.length, start, i, 'keep'), pointers: [{ name: 'i', at: i }, { name: 'end', at: end, tone: 'focus' }], window: [start, end] }), buckets([...last].map(([k, v]) => ({ key: k, items: [v], tone: k === s[i] ? ('focus' as const) : undefined })), { label: 'last index of each letter', keyLabel: 'letter' })])
    if (i === end) { // [3] no letter in the part reaches past here: cut now
      sizes.push(end - start + 1)
      t.step(3, `i reached end ${end}. Every letter in this part ends inside it, so it is safe to cut here. Part size ${end - start + 1}. Cutting as soon as it is safe makes the most parts.`, [arr(chars, { label: 'string (green = closed part)', tones: partTones(s.length, start, i, 'hit'), pointers: [{ name: 'i', at: i, tone: 'hit' }], window: [start, end] }), buckets(sizes.map((n, k) => ({ key: `part ${k + 1}`, items: [n], tone: k === sizes.length - 1 ? ('hit' as const) : undefined })), { label: 'sizes so far', keyLabel: 'part' })])
      start = i + 1
    }
  }
  return sizes
}
