package maximum_product_subarray

func maxProduct(nums []int) int {
	n := len(nums)
	hi := make([]int, n)            // hi[i] = biggest product of a subarray ending at i
	lo := make([]int, n)            // lo[i] = smallest product of a subarray ending at i
	hi[0], lo[0] = nums[0], nums[0] // [1] a subarray of one number is just that number
	best := nums[0]
	for i := 1; i < n; i++ {
		x := nums[i]
		a, b := x*hi[i-1], x*lo[i-1]
		hi[i] = max(x, a, b)    // [2] biggest of: start fresh, extend the biggest, extend the smallest
		lo[i] = min(x, a, b)    // [3] smallest of the same three, kept for the next negative
		best = max(best, hi[i]) // [4] the answer is the biggest hi anywhere
	}
	return best // [4]
}
