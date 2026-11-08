package minimum_window_substring

func minWindow(s string, target string) string {
	need := map[byte]int{} // [1] need[c] > 0: still missing. 0 or less: covered
	for i := 0; i < len(target); i++ {
		need[target[i]]++
	}
	missing := len(target) // [1] letters of target not covered yet, duplicates counted
	left, bestStart, bestLen := 0, 0, len(s)+1
	for right := 0; right < len(s); right++ {
		if need[s[right]] > 0 { // [2] a useful letter enters: one fewer missing
			missing--
		}
		need[s[right]]--
		for missing == 0 { // [3] the window covers target: shrink from the left while it still does
			if right-left+1 < bestLen { // [4] strictly shorter than the best so far: keep it
				bestLen = right - left + 1
				bestStart = left
			}
			need[s[left]]++
			if need[s[left]] > 0 {
				missing++
			}
			left++
		}
	}
	if bestLen > len(s) {
		return "" // [5] empty string when nothing covered
	}
	return s[bestStart : bestStart+bestLen]
}
