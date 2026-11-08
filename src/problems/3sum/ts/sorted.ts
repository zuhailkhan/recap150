import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, mark } from '../../../core/panels'

export function threeSum(nums: number[], t: Tracer = noop): number[][] {
  const a = [...nums].sort((x, y) => x - y) // [1] sorted, so equal values sit side by side and two pointers work
  const out: number[][] = []
  t.step(1, `Sort a copy: [${a.join(', ')}]. Now equal values are neighbours.`, [arr(a, { label: 'sorted' }), buckets([], { label: 'triples', keyLabel: 'found', empty: 'none yet' })])
  for (let i = 0; i < a.length - 2; i++) {
    if (i > 0 && a[i] === a[i - 1]) { // [2] same first number as last time: every triple would repeat
      t.step(2, `${a[i]} at index ${i} equals the one before it. Any triple starting here was already found. Skip it.`, [arr(a, { label: 'sorted', tones: mark(a.length, { [i]: 'miss', [i - 1]: 'dim' }), pointers: [{ name: 'i', at: i, tone: 'miss' }] }), buckets(out.map((x, k) => ({ key: `#${k + 1}`, items: x })), { label: 'triples', keyLabel: 'found', empty: 'none yet' })])
      continue
    }
    let l = i + 1, r = a.length - 1 // [3] two pointers search the rest for a pair that sums to -a[i]
    while (l < r) {
      const sum = a[i] + a[l] + a[r]
      if (sum < 0) { // [3] too small: need a bigger number, move l right
        t.step(3, `${a[i]} + ${a[l]} + ${a[r]} = ${sum}. Too small. Move l right for a bigger number.`, [arr(a, { label: 'sorted', tones: mark(a.length, { [i]: 'focus', [l]: 'miss', [r]: 'keep' }), pointers: [{ name: 'i', at: i }, { name: 'l', at: l }, { name: 'r', at: r }], window: [i + 1, r] }), buckets(out.map((x, k) => ({ key: `#${k + 1}`, items: x })), { label: 'triples', keyLabel: 'found', empty: 'none yet' })])
        l++
      } else if (sum > 0) { // [3] too big: need a smaller number, move r left
        t.step(3, `${a[i]} + ${a[l]} + ${a[r]} = ${sum}. Too big. Move r left for a smaller number.`, [arr(a, { label: 'sorted', tones: mark(a.length, { [i]: 'focus', [l]: 'keep', [r]: 'miss' }), pointers: [{ name: 'i', at: i }, { name: 'l', at: l }, { name: 'r', at: r }], window: [i + 1, r] }), buckets(out.map((x, k) => ({ key: `#${k + 1}`, items: x })), { label: 'triples', keyLabel: 'found', empty: 'none yet' })])
        r--
      } else {
        out.push([a[i], a[l], a[r]]) // [4] sum is zero: record the triple
        t.step(4, `${a[i]} + ${a[l]} + ${a[r]} = 0. Record [${a[i]}, ${a[l]}, ${a[r]}].`, [arr(a, { label: 'sorted', tones: mark(a.length, { [i]: 'hit', [l]: 'hit', [r]: 'hit' }), pointers: [{ name: 'i', at: i, tone: 'hit' }, { name: 'l', at: l, tone: 'hit' }, { name: 'r', at: r, tone: 'hit' }] }), buckets(out.map((x, k) => ({ key: `#${k + 1}`, items: x, tone: k === out.length - 1 ? 'hit' : undefined })), { label: 'triples', keyLabel: 'found', empty: 'none yet' })])
        l++
        r--
        while (l < r && a[l] === a[l - 1]) {
          l++ // [5] step past repeats of the value just used on the left
          t.step(5, `${a[l - 1]} was just used on the left. Skip the repeat so the same triple is not recorded twice.`, [arr(a, { label: 'sorted', tones: mark(a.length, { [i]: 'focus', [l - 1]: 'miss' }), pointers: [{ name: 'i', at: i }, { name: 'l', at: l }, { name: 'r', at: r }], window: [i + 1, r] }), buckets(out.map((x, k) => ({ key: `#${k + 1}`, items: x })), { label: 'triples', keyLabel: 'found', empty: 'none yet' })])
        }
        while (l < r && a[r] === a[r + 1]) {
          r-- // [5] same on the right
          t.step(5, `${a[r + 1]} was just used on the right. Skip the repeat.`, [arr(a, { label: 'sorted', tones: mark(a.length, { [i]: 'focus', [r + 1]: 'miss' }), pointers: [{ name: 'i', at: i }, { name: 'l', at: l }, { name: 'r', at: r }], window: [i + 1, r] }), buckets(out.map((x, k) => ({ key: `#${k + 1}`, items: x })), { label: 'triples', keyLabel: 'found', empty: 'none yet' })])
        }
      }
    }
  }
  t.step(4, `Done. ${out.length} triple${out.length === 1 ? '' : 's'} found, none repeated.`, [arr(a, { label: 'sorted' }), buckets(out.map((x, k) => ({ key: `#${k + 1}`, items: x, tone: 'hit' as const })), { label: 'triples', keyLabel: 'found', empty: 'none' })])
  return out
}
