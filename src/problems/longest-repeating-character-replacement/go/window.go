package longest_repeating_character_replacement

func characterReplacement(s string, k int) int {
	count := map[byte]int{} // [1] how many of each letter are in the window
	left := 0
	maxFreq := 0 // [1] the highest count any letter has reached. It is never lowered
	for right := 0; right < len(s); right++ {
		count[s[right]]++ // [2] take the new letter in and update the top count
		maxFreq = max(maxFreq, count[s[right]])
		if right-left+1-maxFreq > k { // [3] too many to replace: slide the whole window one step right
			count[s[left]]--
			left++
		}
	}
	return len(s) - left // [4] the window never shrinks, so its size is the best length
}
