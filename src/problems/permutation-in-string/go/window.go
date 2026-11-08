package permutation_in_string

func checkInclusion(s1 string, s2 string) bool {
	n := len(s1)
	need := map[byte]int{} // [1] letters still owed to the window. 0 means balanced
	off := 0               // [1] how many letters are not balanced yet
	bump := func(ch byte, d int) {
		before := need[ch]
		need[ch] = before + d
		if before == 0 {
			off++
		} else if before+d == 0 {
			off--
		}
	}
	for i := 0; i < n; i++ {
		bump(s1[i], 1)
	}
	for right := 0; right < len(s2); right++ {
		if right >= n {
			bump(s2[right-n], 1) // [2] the old left letter leaves, so it is owed again
		}
		bump(s2[right], -1) // [3] the new right letter enters, so it is paid off
		if off == 0 {       // [4] every letter is balanced, so the window is a permutation
			return true
		}
	}
	return false
}
