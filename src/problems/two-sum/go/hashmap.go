package two_sum

func twoSum(nums []int, target int) []int {
	seen := map[int]int{} // [1] value -> index, for numbers already passed
	for i, x := range nums {
		need := target - x           // [2] the partner this number is hoping to find
		if j, ok := seen[need]; ok { // [3] partner already seen: that is the answer
			return []int{j, i}
		}
		seen[x] = i // [4] not found yet: remember this number for later
	}
	return nil // unreachable when the input has a pair, as promised
}
