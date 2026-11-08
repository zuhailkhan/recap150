package longest_increasing_subsequence

func lengthOfLIS(nums []int) int {
	n := len(nums)
	dp := make([]int, n)
	for i := range dp {
		dp[i] = 1 // [1] every number alone is an increasing run of length 1
	}
	best := 0
	for i := 0; i < n; i++ {
		for j := 0; j < i; j++ { // [2] look back at every earlier number
			if nums[j] < nums[i] {
				dp[i] = max(dp[i], dp[j]+1) // [3] strictly smaller: extend its run by one
			}
		}
		best = max(best, dp[i]) // [4] the best run can end at any index
	}
	return best
}
