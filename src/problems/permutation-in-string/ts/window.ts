import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets } from '../../../core/panels'

export function checkInclusion(s1: string, s2: string, t: Tracer = noop): boolean {
  const n = s1.length
  const chars = [...s2]
  const need = new Map<string, number>() // [1] letters still owed to the window. 0 means balanced
  let off = 0 // [1] how many letters are not balanced yet
  const bump = (ch: string, d: number) => {
    const before = need.get(ch) ?? 0
    need.set(ch, before + d)
    if (before === 0) off++
    else if (before + d === 0) off--
  }
  for (const ch of s1) bump(ch, 1)
  t.step(1, `Count the letters of "${s1}". Each is owed to the window. The window must be exactly ${n} wide.`, [arr(chars, { label: 's2' }), buckets([...need].map(([k, v]) => ({ key: k, items: [v], tone: v === 0 ? 'hit' as const : 'miss' as const })), { label: `owed (${off} unbalanced)`, keyLabel: 'letter' })])
  for (let right = 0; right < chars.length; right++) {
    if (right >= n) {
      bump(chars[right - n], 1) // [2] the old left letter leaves, so it is owed again
      t.step(2, `Window is full. "${chars[right - n]}" leaves on the left and is owed again.`, [arr(chars, { label: 's2', tones: chars.map((_, i) => (i === right - n ? 'dim' : null)), window: n > 1 ? [right - n + 1, right - 1] : undefined }), buckets([...need].map(([k, v]) => ({ key: k, items: [v], tone: v === 0 ? 'hit' as const : 'miss' as const })), { label: `owed (${off} unbalanced)`, keyLabel: 'letter' })])
    }
    bump(chars[right], -1) // [3] the new right letter enters, so it is paid off
    t.step(3, `"${chars[right]}" enters on the right and pays one off. ${off} letter${off === 1 ? ' is' : 's are'} still unbalanced.`, [arr(chars, { label: 's2', tones: chars.map((_, i) => (i === right ? 'focus' : i > right - n && i < right ? 'keep' : null)), pointers: [{ name: 'r', at: right, tone: 'focus' }], window: [Math.max(0, right - n + 1), right] }), buckets([...need].map(([k, v]) => ({ key: k, items: [v], tone: v === 0 ? 'hit' as const : 'miss' as const })), { label: `owed (${off} unbalanced)`, keyLabel: 'letter' })])
    if (off === 0) { // [4] every letter is balanced, so the window is a permutation
      t.step(4, `Nothing is owed and the window is ${n} wide. "${chars.slice(right - n + 1, right + 1).join('')}" is a permutation of "${s1}".`, [arr(chars, { label: 's2', tones: chars.map((_, i) => (i > right - n && i <= right ? 'hit' : null)), window: [right - n + 1, right] }), buckets([...need].map(([k, v]) => ({ key: k, items: [v], tone: v === 0 ? 'hit' as const : 'miss' as const })), { label: `owed (${off} unbalanced)`, keyLabel: 'letter' })])
      return true
    }
  }
  return false
}
