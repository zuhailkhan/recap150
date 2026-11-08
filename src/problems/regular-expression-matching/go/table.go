package regular_expression_matching

// Assumes a valid pattern: letters a-z, '.', and '*' only right after a letter or '.'.
func isMatch(s string, p string) bool {
	m, n := len(s), len(p)
	// dp[i][j] = do the first i letters of s match the first j symbols of p?
	dp := make([][]bool, m+1)
	for i := range dp {
		dp[i] = make([]bool, n+1)
	}
	dp[0][0] = true // [1] empty text matches empty pattern
	for j := 2; j <= n; j++ {
		if p[j-1] == '*' {
			dp[0][j] = dp[0][j-2] // [1] a star can drop its letter: zero copies
		}
	}

	for i := 1; i <= m; i++ {
		for j := 1; j <= n; j++ {
			if p[j-1] == '*' {
				// [2] star after p[j-2]: use zero copies, or let one more copy eat s[i-1]
				zero := dp[i][j-2]
				eat := (p[j-2] == '.' || p[j-2] == s[i-1]) && dp[i-1][j]
				dp[i][j] = zero || eat
			} else {
				dp[i][j] = (p[j-1] == '.' || p[j-1] == s[i-1]) && dp[i-1][j-1] // [3] plain symbol: it must fit s[i-1] and the diagonal must be true
			}
		}
	}
	return dp[m][n] // [4] the whole text against the whole pattern
}
