package powx_n

func myPow(x float64, n int) float64 {
	base, k := x, n
	if k < 0 {
		base, k = 1/base, -k // [1] a negative power is a positive power of 1/x
	}
	result := 1.0
	for k > 0 { // [3] until every bit of k is used
		if k&1 == 1 { // [2] lowest bit is 1: this base is part of the answer
			result *= base
		}
		base *= base // [3] square the base: it now stands for twice the power
		k >>= 1      // [3] drop the lowest bit of k
	}
	return result
}
