package longest_palindromic_substring

import "strings"

// Several palindromes can tie for longest, so the test checks what matters:
// the answer is a palindrome, it occurs in s, and its length is the expected one.
// Returns [length, 1 if the answer is a real palindromic substring of s, else 0].
func longestPalindromeDriver(s string) []int {
	res := longestPalindrome(s)
	valid := 0
	if len(res) > 0 && strings.Contains(s, res) {
		valid = 1
		for i, j := 0, len(res)-1; i < j; i, j = i+1, j-1 {
			if res[i] != res[j] {
				valid = 0
			}
		}
	}
	return []int{len(res), valid}
}
