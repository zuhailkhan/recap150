package coin_change

func coinChange(coins []int, amount int) int {
	inf := amount + 1 // [1] more coins than any real answer, so it acts as infinity
	dp := make([]int, amount+1)
	for a := range dp {
		dp[a] = inf
	}
	dp[0] = 0
	for a := 1; a <= amount; a++ {
		for _, c := range coins {
			if c <= a {
				dp[a] = min(dp[a], dp[a-c]+1) // [2] use coin c last, plus the best way to make the rest
			}
		}
	}
	if dp[amount] >= inf {
		return -1 // [3] still infinity: impossible
	}
	return dp[amount]
}
