package distinct_subsequences

// Counts can pass 32 bits (for example 34 a letters and a target of 17 a letters), so use int, which is 64-bit on modern machines.
func numDistinct(s string, target string) int {
	m, n := len(s), len(target)
	// dp[i][j] = ways to pick letters from the first i letters of s that spell the first j letters of target
	dp := make([][]int, m+1)
	for i := range dp {
		dp[i] = make([]int, n+1)
		dp[i][0] = 1 // [1] the empty target has exactly one way: pick nothing. Row 0 stays 0 for j > 0
	}

	for i := 1; i <= m; i++ {
		for j := 1; j <= n; j++ {
			dp[i][j] = dp[i-1][j] // [2] always allowed: skip s[i-1], keep the ways found without it
			if s[i-1] == target[j-1] {
				dp[i][j] += dp[i-1][j-1] // [3] letters match: also allowed to use s[i-1] for target[j-1]
			}
		}
	}
	return dp[m][n] // [4] all of s, all of target
}
