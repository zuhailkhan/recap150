package top_k_frequent_elements

func topKFrequent(nums []int, k int) []int {
	count := map[int]int{} // [1] value -> how many times it appears
	for _, x := range nums {
		count[x]++ // [1] one more for this value
	}
	byFreq := make([][]int, len(nums)+1) // [2] slot f holds the values seen f times
	for x, c := range count {
		byFreq[c] = append(byFreq[c], x) // [2] the count is the slot number
	}
	out := []int{}
	for f := len(nums); f >= 1 && len(out) < k; f-- { // [3] walk from the highest slot down
		out = append(out, byFreq[f]...)
	}
	if len(out) > k {
		out = out[:k]
	}
	return out
}
