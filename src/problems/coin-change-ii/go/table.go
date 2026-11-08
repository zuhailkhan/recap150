package coin_change_ii

func change(amount int, coins []int) int {
	k := len(coins)
	dp := make([][]int, k+1)
	for i := range dp {
		dp[i] = make([]int, amount+1) // [1] row i: only the first i kinds of coin may be used
		dp[i][0] = 1                  // [1] amount 0 has exactly one way: take no coins at all
	}
	for i := 1; i <= k; i++ { // coins in the OUTER loop: each combination is built in one fixed coin order
		c := coins[i-1]
		for a := 1; a <= amount; a++ {
			dp[i][a] = dp[i-1][a] // [2] never use coin c: same ways as with the earlier coins
			if a >= c {
				dp[i][a] += dp[i][a-c] // [3] use coin c at least once: take one, then make a - c with the same coins
			}
		}
	}
	return dp[k][amount] // [4] all coins allowed, full amount
}
