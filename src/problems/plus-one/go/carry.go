package plus_one

func plusOne(digits []int) []int {
	out := append([]int(nil), digits...) // work on a copy
	for i := len(out) - 1; i >= 0; i-- { // [1] start at the last digit and walk left
		if out[i] < 9 {
			out[i]++ // [3] a digit below 9 absorbs the carry, so we are done
			return out
		}
		out[i] = 0 // [2] 9 + 1 = 10: write 0 and carry 1 to the left
	}
	return append([]int{1}, out...) // [3] all nines: the result is 1 followed by zeros
}
