package valid_palindrome

func isAlnum(c byte) bool {
	return c >= '0' && c <= '9' || c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z'
}

func lower(c byte) byte {
	if c >= 'A' && c <= 'Z' {
		return c + 'a' - 'A'
	}
	return c
}

func isPalindrome(s string) bool {
	l, r := 0, len(s)-1 // [1] one pointer at each end
	for l < r {
		for l < r && !isAlnum(s[l]) {
			l++ // [2] skip anything that is not a letter or digit
		}
		for l < r && !isAlnum(s[r]) {
			r-- // [2] same on the right side
		}
		if l >= r {
			break // the pointers met while skipping: nothing left to compare
		}
		if lower(s[l]) != lower(s[r]) { // [3] compare the two ends, ignoring case
			return false
		}
		l++ // [4] this pair is fine, move both pointers inward
		r--
	}
	return true // [5] every pair matched
}
