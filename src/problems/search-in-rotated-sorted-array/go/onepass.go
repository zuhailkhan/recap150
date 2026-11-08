package search_in_rotated_sorted_array

func search(nums []int, target int) int {
	l := 0             // [1] the live range is nums[l..r]
	r := len(nums) - 1 // [1]
	for l <= r {       // [2] something is still live: look at its middle
		m := l + (r-l)/2
		if nums[m] == target { // [5] found it: that is the answer
			return m
		}
		leftSorted := nums[l] <= nums[m] // [3] one side of m is always in order: which one?
		var goLeft bool                  // [4] does the target lie left of m?
		if leftSorted {
			goLeft = nums[l] <= target && target < nums[m] // [4] left side is ordered: is the target inside it?
		} else {
			goLeft = !(nums[m] < target && target <= nums[r]) // [4] right side is ordered: if not inside it, go left
		}
		if goLeft {
			r = m - 1 // [4] drop the middle and everything right of it
		} else {
			l = m + 1 // [4] drop the middle and everything left of it
		}
	}
	return -1 // [5] the live range is empty: not found
}
