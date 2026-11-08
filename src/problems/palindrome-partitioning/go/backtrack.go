package palindrome_partitioning

func partition(s string) [][]string {
	out := [][]string{}
	path := []string{} // [1] the pieces cut so far
	isPal := func(l, r int) bool {
		for l < r {
			if s[l] != s[r] {
				return false
			}
			l++
			r--
		}
		return true
	}
	var walk func(start int)
	walk = func(start int) {
		if start == len(s) { // [4] the whole string is cut: save a copy of the pieces
			out = append(out, append([]string{}, path...))
			return
		}
		for end := start + 1; end <= len(s); end++ {
			if !isPal(start, end-1) { // [2] not a palindrome: this piece is rejected
				continue
			}
			path = append(path, s[start:end]) // [3] it is a palindrome: cut it off, then split what is left
			walk(end)
			path = path[:len(path)-1] // [5] undo the cut, then try a longer piece
		}
	}
	walk(0)
	return out // [5] all partitions
}
