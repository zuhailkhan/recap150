package longest_palindromic_substring

func longestPalindrome(s string) string {
	start, length := 0, 0 // [1] the best palindrome so far is s[start : start+length], empty at first
	for c := 0; c < len(s); c++ {
		for w := 0; w <= 1; w++ { // w = 0: odd centre on c. w = 1: even centre between c and c + 1
			l, r := c, c+w
			for l >= 0 && r < len(s) && s[l] == s[r] { // [2] the ends match, so s[l..r] is a palindrome
				l--
				r++ // [2] grow outward by one letter on each side
			}
			size := r - l - 1  // [3] the loop stopped: s[l+1 .. r-1] is the longest palindrome at this centre
			if size > length { // [3] keep it only if it beats the best so far
				start, length = l+1, size
			}
		}
	}
	return s[start : start+length] // [4] the best window
}
