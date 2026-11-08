package interleaving_string

func isInterleave(s1 string, s2 string, s3 string) bool {
	m, n := len(s1), len(s2)
	if m+n != len(s3) {
		return false // [1] lengths must add up, or no weave can use every letter once
	}
	dp := make([][]bool, m+1)
	for i := range dp {
		dp[i] = make([]bool, n+1) // [1] (m+1) x (n+1): rows = letters taken from s1, columns = letters taken from s2
	}
	for i := 0; i <= m; i++ {
		for j := 0; j <= n; j++ {
			if i == 0 && j == 0 {
				dp[0][0] = true // [2] no letters from either string build the empty prefix of s3
				continue
			}
			c := s3[i+j-1]                               // [3] the newest letter of s3 must come from s1 or from s2
			viaS1 := i > 0 && dp[i-1][j] && s1[i-1] == c // [3] from s1: the cell above works, and s1's next letter matches
			viaS2 := j > 0 && dp[i][j-1] && s2[j-1] == c // [4] from s2: the cell to the left works, and s2's next letter matches
			dp[i][j] = viaS1 || viaS2                    // [4] either route is enough
		}
	}
	return dp[m][n] // [5] all of s1 and s2 used, all of s3 built
}
