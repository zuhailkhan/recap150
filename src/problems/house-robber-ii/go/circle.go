package house_robber_ii

func robCircle(nums []int) int {
	n := len(nums)
	if n == 1 {
		return nums[0] // [1] one house has no neighbour
	}
	skipLast := robLine(nums, 0, n-1) // [2] the row without the last house
	skipFirst := robLine(nums, 1, n)  // [3] the row without the first house
	return max(skipLast, skipFirst)   // [6] the better of the two rows
}

// House Robber on the straight row nums[lo:hi]
func robLine(nums []int, lo, hi int) int {
	m := hi - lo
	dp := make([]int, m+1) // [4] dp[k] = most loot from the first k houses of the row
	dp[1] = nums[lo]       // [4] one house: take it
	for k := 2; k <= m; k++ {
		skip := dp[k-1]                // [5] skip the k-th house of the row
		take := dp[k-2] + nums[lo+k-1] // [5] rob it, so build on dp[k-2]
		dp[k] = max(skip, take)        // [5] the better of the two choices
	}
	return dp[m]
}
