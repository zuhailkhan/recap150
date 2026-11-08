package unique_paths

func uniquePaths(m int, n int) int {
	dp := make([][]int, m)
	for i := range dp {
		dp[i] = make([]int, n) // [1] every row is its own slice
		for j := range dp[i] {
			dp[i][j] = 1 // [1] first row and first column: one way each (go straight)
		}
	}
	for i := 1; i < m; i++ {
		for j := 1; j < n; j++ {
			dp[i][j] = dp[i-1][j] + dp[i][j-1] // [2] you arrive from above or from the left: add both
		}
	}
	return dp[m-1][n-1] // [3] the bottom-right square is the answer
}
