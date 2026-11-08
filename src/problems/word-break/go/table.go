package word_break

func wordBreak(s string, wordDict []string) bool {
	words := make(map[string]bool, len(wordDict))
	for _, w := range wordDict {
		words[w] = true
	}
	n := len(s)
	dp := make([]bool, n+1)
	dp[0] = true // [1] the empty prefix splits into zero words
	for i := 1; i <= n; i++ {
		for j := 0; j < i; j++ {
			if dp[j] && words[s[j:i]] { // [2] a good prefix of length j, then one word s[j..i)
				dp[i] = true
				break
			}
		}
	}
	return dp[n] // [3] can the whole string be split?
}
