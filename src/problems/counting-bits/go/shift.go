package counting_bits

func countBits(n int) []int {
	ans := make([]int, n+1) // [1] entry 0 stays 0, and every later entry is filled from earlier ones
	for i := 1; i <= n; i++ {
		half := ans[i>>1]       // [2] i >> 1 is i without its last bit. It is smaller, so already solved
		ans[i] = half + (i & 1) // [3] add 1 back if the dropped bit was a 1
	}
	return ans
}
