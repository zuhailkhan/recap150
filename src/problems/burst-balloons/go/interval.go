package burst_balloons

func maxCoins(nums []int) int {
	a := make([]int, 0, len(nums)+2)
	a = append(a, 1) // [1] pad both ends with a 1: a missing neighbour counts as 1
	a = append(a, nums...)
	a = append(a, 1)
	n := len(a)
	// dp[l][r] = most coins from bursting every balloon strictly between l and r (l and r stay)
	dp := make([][]int, n)
	for i := range dp {
		dp[i] = make([]int, n)
	}

	for gap := 2; gap < n; gap++ { // [2] short ranges first, so the smaller ranges inside are ready
		for l := 0; l+gap < n; l++ {
			r := l + gap
			for k := l + 1; k < r; k++ { // [3] try balloon k as the LAST one burst between l and r
				coins := dp[l][k] + a[l]*a[k]*a[r] + dp[k][r]
				dp[l][r] = max(dp[l][r], coins) // [4] keep the best choice of last balloon
			}
		}
	}
	return dp[0][n-1] // [5] range (0, n-1) holds every real balloon
}
