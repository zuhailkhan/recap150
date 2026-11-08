import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function lengthOfLongestSubstring(s: string, t: Tracer = noop): number {
  const chars = [...s]
  const seen = new Set<string>() // [1] letters currently inside the window
  let left = 0
  let best = 0
  t.step(1, 'Start with an empty window and an empty set of letters.', [arr(chars, { label: 's' }), arr([], { label: 'letters in window' })])
  for (let right = 0; right < chars.length; right++) {
    while (seen.has(chars[right])) { // [2] duplicate: shrink from the left until it is gone
      seen.delete(chars[left])
      left++
      t.step(2, `"${chars[right]}" is already in the window. Drop "${chars[left - 1]}" from the left.`, [arr(chars, { label: 's', tones: chars.map((_, k) => (k < left ? 'dim' : k < right ? 'keep' : k === right ? 'miss' : null)), pointers: [{ name: 'l', at: left }, { name: 'r', at: right, tone: 'miss' }], window: [left, right - 1] }), arr([...seen], { label: 'letters in window', tones: [...seen].map(() => 'keep' as const) })])
    }
    seen.add(chars[right]) // [3] no duplicate now: take the new letter in
    t.step(3, `Add "${chars[right]}". The window "${chars.slice(left, right + 1).join('')}" has no repeats.`, [arr(chars, { label: 's', tones: chars.map((_, k) => (k < left ? 'dim' : k < right ? 'keep' : k === right ? 'focus' : null)), pointers: [{ name: 'l', at: left }, { name: 'r', at: right, tone: 'focus' }], window: [left, right] }), arr([...seen], { label: 'letters in window', tones: [...seen].map((c) => (c === chars[right] ? 'focus' : 'keep')) })])
    best = Math.max(best, right - left + 1) // [4] the window is valid: remember its length
    t.step(4, `The window length is ${right - left + 1}. Longest so far: ${best}.`, [arr(chars, { label: 's', tones: chars.map((_, k) => (k < left ? 'dim' : k <= right ? 'hit' : null)), pointers: [{ name: 'l', at: left }, { name: 'r', at: right }], window: [left, right] }), arr([best], { label: 'best length', tones: ['hit'] })])
  }
  return best
}
