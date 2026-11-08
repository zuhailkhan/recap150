import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets } from '../../../core/panels'

export function minWindow(s: string, target: string, t: Tracer = noop): string {
  const chars = [...s]
  const need = new Map<string, number>() // [1] need[c] > 0: still missing. 0 or less: covered
  for (const c of target) need.set(c, (need.get(c) ?? 0) + 1)
  let missing = target.length // [1] letters of target not covered yet, duplicates counted
  let left = 0
  let bestStart = 0
  let bestLen = Infinity
  t.step(1, `Count what "${target}" needs. ${missing} letter${missing === 1 ? ' is' : 's are'} missing from the empty window.`, [arr(chars, { label: 's' }), buckets([...new Set(target)].map((c) => ({ key: c, items: [need.get(c) ?? 0], tone: 'miss' as const })), { label: 'still needed', keyLabel: 'letter' })])
  for (let right = 0; right < chars.length; right++) {
    const c = chars[right]
    if ((need.get(c) ?? 0) > 0) missing-- // [2] a useful letter enters: one fewer missing
    need.set(c, (need.get(c) ?? 0) - 1)
    t.step(2, (need.get(c) ?? 0) >= 0 ? `Add "${c}". It was needed, so ${missing} still missing.` : `Add "${c}". It is not needed (or surplus). ${missing} still missing.`, [arr(chars, { label: 's', tones: chars.map((_, i) => (i === right ? 'focus' : i >= left && i < right ? 'keep' : i < left ? 'dim' : null)), pointers: [{ name: 'l', at: left }, { name: 'r', at: right, tone: 'focus' }], window: [left, right] }), buckets([...new Set(target)].map((x) => ({ key: x, items: [need.get(x) ?? 0], tone: (need.get(x) ?? 0) > 0 ? 'miss' as const : 'hit' as const })), { label: 'still needed (0 or less: covered)', keyLabel: 'letter' })])
    while (missing === 0) { // [3] the window covers target: shrink from the left while it still does
      if (right - left + 1 < bestLen) { // [4] strictly shorter than the best so far: keep it
        bestLen = right - left + 1
        bestStart = left
        t.step(4, `The window "${s.slice(left, right + 1)}" covers everything and is the shortest so far (${bestLen}).`, [arr(chars, { label: 's', tones: chars.map((_, i) => (i >= left && i <= right ? 'hit' : i < left ? 'dim' : null)), pointers: [{ name: 'l', at: left }, { name: 'r', at: right }], window: [left, right] }), arr([...s.slice(bestStart, bestStart + bestLen)], { label: 'best so far', tones: [...s.slice(bestStart, bestStart + bestLen)].map(() => 'hit' as const) })])
      }
      const out = chars[left]
      need.set(out, (need.get(out) ?? 0) + 1)
      if ((need.get(out) ?? 0) > 0) missing++
      left++
      t.step(3, missing > 0 ? `Drop "${out}" from the left. It was needed, so the window no longer covers. Grow right again.` : `Drop "${out}" from the left. It was spare, so the window still covers. Keep shrinking.`, [arr(chars, { label: 's', tones: chars.map((_, i) => (i === left - 1 ? 'miss' : i < left ? 'dim' : i <= right ? 'keep' : null)), pointers: [{ name: 'l', at: Math.min(left, chars.length - 1) }, { name: 'r', at: right }], window: left <= right ? [left, right] : undefined }), buckets([...new Set(target)].map((x) => ({ key: x, items: [need.get(x) ?? 0], tone: (need.get(x) ?? 0) > 0 ? 'miss' as const : 'hit' as const })), { label: 'still needed (0 or less: covered)', keyLabel: 'letter' })])
    }
  }
  t.step(5, bestLen === Infinity ? 'No window ever covered the target. Return an empty string.' : `Scan done. The shortest covering window is "${s.slice(bestStart, bestStart + bestLen)}".`, [arr(chars, { label: 's', tones: chars.map((_, i) => (bestLen !== Infinity && i >= bestStart && i < bestStart + bestLen ? 'hit' : 'dim')), window: bestLen === Infinity ? undefined : [bestStart, bestStart + bestLen - 1] })])
  return bestLen === Infinity ? '' : s.slice(bestStart, bestStart + bestLen) // [5] empty string when nothing covered
}
