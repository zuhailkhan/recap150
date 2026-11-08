import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { grown, stopped } from './viz'

export function longestPalindrome(s: string, t: Tracer = noop): string {
  let start = 0, len = 0 // [1] the best palindrome so far is s.substring(start, start + len), empty at first
  t.step(1, `No palindrome found yet. Every palindrome has a centre: a letter (odd length) or the gap between two letters (even length). Try each centre and grow outward.`, [arr(s.split(''), { label: 's' })])
  for (let c = 0; c < s.length; c++) {
    for (const w of [0, 1]) { // w = 0: odd centre on c. w = 1: even centre between c and c + 1
      let l = c, r = c + w
      while (l >= 0 && r < s.length && s[l] === s[r]) { // [2] the ends match, so s[l..r] is a palindrome
        t.step(2, ...grown(s, c, w, l, r, start, len))
        l--
        r++ // [2] grow outward by one letter on each side
      }
      const size = r - l - 1 // [3] the loop stopped: s[l+1 .. r-1] is the longest palindrome at this centre
      if (size > len) { start = l + 1; len = size } // [3] keep it only if it beats the best so far
      t.step(3, ...stopped(s, c, w, l, r, start, len))
    }
  }
  t.step(4, `Every centre is done. The longest palindrome is "${s.substring(start, start + len)}", length ${len}.`, [arr(s.split(''), { label: 's', tones: Array.from(s, (_, i) => (i >= start && i < start + len ? 'hit' : null)) })])
  return s.substring(start, start + len) // [4] the best window
}
