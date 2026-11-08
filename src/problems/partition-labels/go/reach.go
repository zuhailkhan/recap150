package partition_labels

func partitionLabels(s string) []int {
	var last [26]int // [1] letter -> index of its last occurrence
	for i := 0; i < len(s); i++ {
		last[s[i]-'a'] = i
	}
	sizes := []int{}
	start := 0 // where the current part began
	end := 0   // [2] the farthest last occurrence of any letter in the current part
	for i := 0; i < len(s); i++ {
		end = max(end, last[s[i]-'a']) // [2] this letter drags the part's end out to its last occurrence
		if i == end {                  // [3] no letter in the part reaches past here: cut now
			sizes = append(sizes, end-start+1)
			start = i + 1
		}
	}
	return sizes
}
