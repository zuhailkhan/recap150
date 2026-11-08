package valid_anagram

func isAnagram(s string, t string) bool {
	if len(s) != len(t) { // [1] different lengths can never match
		return false
	}
	var count [26]int // [1] letter -> how many more times s used it than t so far
	for i := 0; i < len(s); i++ {
		count[s[i]-'a']++ // [2] count up with the letters of s
	}
	for i := 0; i < len(t); i++ {
		count[t[i]-'a']--        // [3] count down with the letters of t
		if count[t[i]-'a'] < 0 { // [3] t used a letter more often than s had it
			return false
		}
	}
	return true // [4] equal lengths and no count went negative, so all are zero
}
