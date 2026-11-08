package maximum_subarray

func maxSubArray(nums []int) int {
	best := nums[0] // [1] best sum so far. Start from a real element, not 0, so all-negative input works
	run := 0        // [1] sum of the run that ends at the current index
	for _, x := range nums {
		if run < 0 { // [2] a negative run can only drag a later subarray down, so drop it
			run = 0
		}
		run += x        // [3] extend the run with this number
		if run > best { // [4] a better sum than any before
			best = run
		}
	}
	return best
}
