package find_minimum_in_rotated_sorted_array

func findMin(nums []int) int {
	l := 0             // [1] the minimum is always inside nums[l..r]
	r := len(nums) - 1 // [1]
	for l < r {        // [2] more than one candidate left: look at the middle
		m := l + (r-l)/2
		if nums[m] > nums[r] { // [3] m is in the high left part: the minimum is right of m
			l = m + 1
		} else {
			r = m // [4] m is in the low right part: the minimum is m or left of m
		}
	}
	return nums[l] // [5] one candidate left: it is the minimum
}
