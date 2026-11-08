import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, mark } from '../../../core/panels'

const isAlnum = (c: string) => /[a-z0-9]/i.test(c)

export function isPalindrome(s: string, t: Tracer = noop): boolean {
  let l = 0, r = s.length - 1 // [1] one pointer at each end
  t.step(1, `Put one pointer at each end of "${s}". They walk toward each other.`, [arr(s.split(''), { label: 's', pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
  while (l < r) {
    while (l < r && !isAlnum(s[l])) {
      l++ // [2] skip anything that is not a letter or digit
      t.step(2, `'${s[l - 1]}' is not a letter or digit. Skip it. l moves to ${l}.`, [arr(s.split(''), { label: 's', tones: mark(s.length, { [l - 1]: 'miss' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
    }
    while (l < r && !isAlnum(s[r])) {
      r-- // [2] same on the right side
      t.step(2, `'${s[r + 1]}' is not a letter or digit. Skip it. r moves to ${r}.`, [arr(s.split(''), { label: 's', tones: mark(s.length, { [r + 1]: 'miss' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
    }
    if (l >= r) break // the pointers met while skipping: nothing left to compare
    if (s[l].toLowerCase() !== s[r].toLowerCase()) { // [3] compare the two ends, ignoring case
      t.step(3, `'${s[l]}' and '${s[r]}' differ. Not a palindrome.`, [arr(s.split(''), { label: 's', tones: mark(s.length, { [l]: 'miss', [r]: 'miss' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
      return false
    }
    t.step(3, `'${s[l]}' and '${s[r]}' match once case is ignored.`, [arr(s.split(''), { label: 's', tones: mark(s.length, { [l]: 'hit', [r]: 'hit' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
    l++ // [4] this pair is fine, move both pointers inward
    r--
    t.step(4, `Pair done. Move both pointers inward: l = ${l}, r = ${r}.`, [arr(s.split(''), { label: 's', pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
  }
  t.step(5, 'The pointers met or crossed and every pair matched. It is a palindrome.', [arr(s.split(''), { label: 's', tones: s.split('').map(() => 'hit' as const) })])
  return true // [5] every pair matched
}
