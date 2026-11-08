package min_cost_climbing_stairs

func minCostClimbingStairs(cost []int) int {
	n := len(cost)
	dp := make([]int, n+1) // [1] dp[i] = cheapest total paid to stand on step i. The top is step n
	// [1] the first two cells stay 0: you may start on step 0 or step 1 for free
	for i := 2; i <= n; i++ {
		fromOne := dp[i-1] + cost[i-1] // [2] arrive by a 1-step: pay to leave step i-1
		fromTwo := dp[i-2] + cost[i-2] // [2] arrive by a 2-step: pay to leave step i-2
		dp[i] = min(fromOne, fromTwo)  // [2] take the cheaper way in
	}
	return dp[n] // [3] the top is one past the last step
}
