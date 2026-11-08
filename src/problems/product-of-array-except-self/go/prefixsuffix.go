package product_of_array_except_self

func productExceptSelf(nums []int) []int {
	n := len(nums)
	out := make([]int, n) // [1] out[i] will hold the answer for index i
	prefix := 1           // product of everything left of i
	for i := 0; i < n; i++ {
		out[i] = prefix // [2] left sweep: out[i] is the product of everything left of i
		prefix *= nums[i]
	}
	suffix := 1 // product of everything right of i
	for i := n - 1; i >= 0; i-- {
		out[i] *= suffix // [3] right sweep: multiply in everything right of i
		suffix *= nums[i]
	}
	return out
}
