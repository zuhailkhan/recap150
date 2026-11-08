package partition_equal_subset_sum

func canPartition(nums []int) bool {
	total := 0
	for _, x := range nums {
		total += x
	}
	if total%2 == 1 {
		return false // [1] an odd total cannot split into two equal halves
	}
	target := total / 2
	dp := make([]bool, target+1) // [2] dp[s] = some of the numbers so far add up to s
	dp[0] = true                 // [2] the empty subset adds up to 0
	for _, x := range nums {
		for s := target; s >= x; s-- { // [3] sweep backwards so each number is used once
			if !dp[s] && dp[s-x] { // [4] s - x was reachable without x, so adding x reaches s
				dp[s] = true
			}
		}
	}
	return dp[target] // [5] can some subset reach half the total?
}
