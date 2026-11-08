package target_sum

func findTargetSumWays(nums []int, target int) int {
	n := len(nums)
	total := 0
	for _, x := range nums {
		total += x
	}
	off := total // [1] column s + off holds running sum s, so negative sums get a column too
	dp := make([][]int, n+1)
	for i := range dp {
		dp[i] = make([]int, 2*total+1)
	}
	dp[0][off] = 1 // [1] no numbers used yet: running sum 0, reached in exactly one way
	reach := 0     // sums so far stay between -reach and reach
	for i := 1; i <= n; i++ {
		x := nums[i-1]
		for s := -reach; s <= reach; s++ {
			dp[i][s+x+off] += dp[i-1][s+off] // [2] choose +x: every way to reach s now reaches s + x
		}
		for s := -reach; s <= reach; s++ {
			dp[i][s-x+off] += dp[i-1][s+off] // [3] choose -x: the same ways also reach s - x, and counts landing on one cell add up
		}
		reach += x
	}
	if target < -total || target > total {
		return 0 // [4] out of range: no sign choice can reach it
	}
	return dp[n][target+off] // [4] ways to reach the target using all numbers
}
