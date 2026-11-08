package longest_substring_without_repeating_characters

func lengthOfLongestSubstring(s string) int {
	seen := map[byte]bool{} // [1] letters currently inside the window
	left, best := 0, 0
	for right := 0; right < len(s); right++ {
		for seen[s[right]] { // [2] duplicate: shrink from the left until it is gone
			delete(seen, s[left])
			left++
		}
		seen[s[right]] = true          // [3] no duplicate now: take the new letter in
		best = max(best, right-left+1) // [4] the window is valid: remember its length
	}
	return best
}
