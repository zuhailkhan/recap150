package decode_ways

func numDecodings(s string) int {
	n := len(s)
	dp := make([]int, n+1)
	dp[0] = 1 // [1] the empty prefix has exactly one reading
	for i := 1; i <= n; i++ {
		if s[i-1] != '0' {
			dp[i] += dp[i-1] // [2] last digit alone is a letter (1 to 9)
		}
		pair := 0
		if i >= 2 {
			pair = int(s[i-2]-'0')*10 + int(s[i-1]-'0')
		}
		if pair >= 10 && pair <= 26 {
			dp[i] += dp[i-2] // [3] last two digits together make a letter (10 to 26)
		}
	}
	return dp[n] // [4] readings of the full string
}
