package missing_number

func missingNumber(nums []int) int {
	x := len(nums) // [1] start with n: the index that no position carries
	for i, v := range nums {
		x ^= i ^ v // [2] XOR in the index and the value. Each number met twice cancels
	}
	return x // [3] the only value that never cancelled
}
