import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { found, finished } from './viz'

export function countSubstrings(s: string, t: Tracer = noop): number {
  let count = 0 // [1] how many palindromic substrings have been found
  t.step(1, `Count starts at 0. Every palindrome has a centre: a letter (odd length) or a gap between two letters (even length). Grow from each centre and count every window that matches.`, [arr(s.split(''), { label: 's (count = 0)' })])
  for (let c = 0; c < s.length; c++) {
    for (const w of [0, 1]) { // w = 0: odd centre on c. w = 1: even centre between c and c + 1
      let l = c, r = c + w
      while (l >= 0 && r < s.length && s[l] === s[r]) { // [2] the ends match, so s[l..r] is one more palindrome
        count++
        t.step(2, ...found(s, c, w, l, r, count))
        l--
        r++ // [2] grow outward and test the next window
      }
      // [3] the growth stopped: this centre is finished
      t.step(3, ...finished(s, c, w, l, r, count))
    }
  }
  t.step(4, `Every centre is done. There are ${count} palindromic substrings.`, [arr(s.split(''), { label: `s. answer = ${count}`, tones: Array.from(s, () => 'hit' as const) })])
  return count // [4] total over all centres
}
