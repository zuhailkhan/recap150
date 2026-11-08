package house_robber

func rob(nums []int) int {
	n := len(nums)
	if n == 0 {
		return 0
	}
	dp := make([]int, n+1) // [1] dp[i] = most loot from the first i houses. zero houses is worth 0
	dp[1] = nums[0]        // [1] with one house, take it
	for i := 2; i <= n; i++ {
		skip := dp[i-1]             // [2] skip house i: keep the best of the first i-1 houses
		take := dp[i-2] + nums[i-1] // [2] rob house i: its neighbour is off limits, so build on dp[i-2]
		dp[i] = max(skip, take)     // [2] the better of the two choices
	}
	return dp[n] // [3] the best over all n houses
}
