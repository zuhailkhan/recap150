package binary_search

func search(nums []int, target int) int {
	l := 0             // [1] the live range is nums[l..r]
	r := len(nums) - 1 // [1]
	for l <= r {       // [2] something is still live: look at its middle
		m := l + (r-l)/2
		if nums[m] == target { // [4] found it: that is the answer
			return m
		}
		if nums[m] < target {
			l = m + 1 // [3] middle is too small: drop it and everything left of it
		} else {
			r = m - 1 // [3] middle is too big: drop it and everything right of it
		}
	}
	return -1 // [4] the live range is empty: not found
}
