package longest_common_subsequence

func longestCommonSubsequence(text1 string, text2 string) int {
	m, n := len(text1), len(text2)
	dp := make([][]int, m+1)
	for i := range dp {
		dp[i] = make([]int, n+1) // [1] one extra row and column of 0s: an empty prefix shares nothing
	}
	for i := 1; i <= m; i++ {
		for j := 1; j <= n; j++ {
			if text1[i-1] == text2[j-1] {
				dp[i][j] = dp[i-1][j-1] + 1 // [2] same letter: pair them up, add 1 to the best of both shorter prefixes
			} else {
				dp[i][j] = max(dp[i-1][j], dp[i][j-1]) // [3] different letters: drop one of them and keep the better result
			}
		}
	}
	return dp[m][n] // [4] the bottom-right cell covers both whole strings
}
