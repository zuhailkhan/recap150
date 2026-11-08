import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, fromMap } from '../../../core/panels'

export function characterReplacement(s: string, k: number, t: Tracer = noop): number {
  const chars = [...s]
  const count = new Map<string, number>() // [1] how many of each letter are in the window
  let left = 0
  let maxFreq = 0 // [1] the highest count any letter has reached. It is never lowered
  t.step(1, `Start empty. Up to ${k} letter${k === 1 ? '' : 's'} may be replaced inside the window.`, [arr(chars, { label: 's' }), buckets([], { label: 'letter counts in window', keyLabel: 'letter', empty: 'none yet' })])
  for (let right = 0; right < chars.length; right++) {
    const c = chars[right]
    count.set(c, (count.get(c) ?? 0) + 1) // [2] take the new letter in and update the top count
    maxFreq = Math.max(maxFreq, count.get(c) ?? 0)
    t.step(2, `Add "${c}". Window size ${right - left + 1}, top count ${maxFreq}, so ${right - left + 1 - maxFreq} to replace. Allowed: ${k}.`, [arr(chars, { label: 's', tones: chars.map((_, i) => (i < left ? 'dim' : i < right ? 'keep' : i === right ? 'focus' : null)), pointers: [{ name: 'l', at: left }, { name: 'r', at: right, tone: 'focus' }], window: [left, right] }), buckets(fromMap(count, c), { label: 'letter counts in window', keyLabel: 'letter' }), arr([maxFreq], { label: 'maxFreq', tones: ['hit'] })])
    if (right - left + 1 - maxFreq > k) { // [3] too many to replace: slide the whole window one step right
      count.set(chars[left], (count.get(chars[left]) ?? 0) - 1)
      left++
      t.step(3, `${right - left + 1 + 1 - maxFreq} to replace is more than ${k}. Drop "${chars[left - 1]}" from the left. The window keeps its size and slides.`, [arr(chars, { label: 's', tones: chars.map((_, i) => (i < left ? 'dim' : i < right ? 'keep' : i === right ? 'focus' : null)), pointers: [{ name: 'l', at: left, tone: 'miss' }, { name: 'r', at: right, tone: 'focus' }], window: [left, right] }), buckets(fromMap(count, chars[left - 1]), { label: 'letter counts in window', keyLabel: 'letter' }), arr([maxFreq], { label: 'maxFreq', tones: ['hit'] })])
    }
  }
  t.step(4, `The window never shrank, so its final size is the answer: ${chars.length - left}.`, [arr(chars, { label: 's', tones: chars.map((_, i) => (i < left ? 'dim' : 'hit')), window: left < chars.length ? [left, chars.length - 1] : undefined })])
  return chars.length - left // [4] the window never shrinks, so its size is the best length
}
