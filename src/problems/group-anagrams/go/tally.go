package group_anagrams

func groupAnagramsTally(strs []string) [][]string {
	groups := map[[26]int][]string{} // [1] fingerprint -> the words that share it
	for _, w := range strs {
		var count [26]int // [2] letter counts are the key; arrays can be map keys in Go
		for _, ch := range w {
			count[ch-'a']++
		}
		groups[count] = append(groups[count], w) // [3] drop the word into its bin
	}
	result := make([][]string, 0, len(groups))
	for _, g := range groups {
		result = append(result, g) // [4] the bins are the answer
	}
	return result
}
