import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { longestPalindrome } from './expand'

// Several palindromes can tie for longest, so the test checks what matters:
// the answer is a palindrome, it occurs in s, and its length is the expected one.
// Returns [length, 1 if the answer is a real palindromic substring of s, else 0].
export function longestPalindromeDriver(s: string, t: Tracer = noop): number[] {
  const res = longestPalindrome(s, t)
  const valid = res.length > 0 && s.includes(res) && res === [...res].reverse().join('')
  return [res.length, valid ? 1 : 0]
}
