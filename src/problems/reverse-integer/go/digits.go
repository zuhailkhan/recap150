package reverse_integer

func reverse(x int) int {
	const lim = 214748364 // [1] 2147483647 divided by 10, rounded toward zero
	result := 0
	for x != 0 {
		digit := x % 10                                                                                      // [2] the last digit. % keeps the sign of x
		x /= 10                                                                                              // [2] drop it. Integer division already rounds toward zero
		if result > lim || (result == lim && digit > 7) || result < -lim || (result == -lim && digit < -8) { // [3] result * 10 + digit would not fit in 32 bits
			return 0
		}
		result = result*10 + digit // [3] safe: push the digit on the right
	}
	return result // [4] x is used up
}
