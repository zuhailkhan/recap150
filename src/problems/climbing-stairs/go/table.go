package climbing_stairs

func climbStairs(n int) int {
	dp := make([]int, n+1) // [1] dp[i] = ways to reach step i. n + 1 cells: step 0 is the ground
	dp[0] = 1              // [1] one way to stand on the ground: do nothing
	dp[1] = 1              // [1] one way to reach step 1: a single 1-step
	for i := 2; i <= n; i++ {
		dp[i] = dp[i-1] + dp[i-2] // [2] the last move was a 1-step (from i-1) or a 2-step (from i-2)
	}
	return dp[n] // [3] the top step is the last cell
}
