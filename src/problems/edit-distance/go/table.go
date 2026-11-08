package edit_distance

func minDistance(word1 string, word2 string) int {
	m, n := len(word1), len(word2)
	// dp[i][j] = fewest edits that turn the first i letters of word1 into the first j letters of word2
	dp := make([][]int, m+1)
	for i := range dp {
		dp[i] = make([]int, n+1)
	}
	for i := 0; i <= m; i++ {
		dp[i][0] = i // [1] first column: delete all i letters to reach the empty word
	}
	for j := 0; j <= n; j++ {
		dp[0][j] = j // [1] first row: insert all j letters starting from the empty word
	}

	for i := 1; i <= m; i++ {
		for j := 1; j <= n; j++ {
			if word1[i-1] == word2[j-1] { // [2] same letter: no edit, copy the diagonal
				dp[i][j] = dp[i-1][j-1]
			} else {
				// [3] different letters: 1 edit plus the cheapest of delete (up), insert (left), replace (diagonal)
				dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
			}
		}
	}
	return dp[m][n] // [4] the whole word1 to the whole word2
}
