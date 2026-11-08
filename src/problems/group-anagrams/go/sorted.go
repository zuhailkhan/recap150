package group_anagrams

import "slices"

func groupAnagramsSorted(strs []string) [][]string {
	groups := map[string][]string{} // [1] fingerprint -> the words that share it
	for _, w := range strs {
		b := []byte(w)
		slices.Sort(b)
		key := string(b)                     // [2] same letters, same sorted key
		groups[key] = append(groups[key], w) // [3] drop the word into its bin
	}
	result := make([][]string, 0, len(groups))
	for _, g := range groups {
		result = append(result, g) // [4] the bins are the answer
	}
	return result
}
