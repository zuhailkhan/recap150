package palindromic_substrings

func countSubstrings(s string) int {
	count := 0 // [1] how many palindromic substrings have been found
	for c := 0; c < len(s); c++ {
		for w := 0; w <= 1; w++ { // w = 0: odd centre on c. w = 1: even centre between c and c + 1
			l, r := c, c+w
			for l >= 0 && r < len(s) && s[l] == s[r] { // [2] the ends match, so s[l..r] is one more palindrome
				count++
				l--
				r++ // [2] grow outward and test the next window
			}
			// [3] the growth stopped: this centre is finished
		}
	}
	return count // [4] total over all centres
}
