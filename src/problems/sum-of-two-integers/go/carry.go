package sum_of_two_integers

func getSum(a, b int) int {
	x, y := int32(a), int32(b) // [1] work in 32 bits so the sum wraps the way a 32-bit int does
	for y != 0 {               // [1] keep going while a carry is left to add
		carry := (x & y) << 1 // [2] columns where both bits are 1 carry into the next column on the left
		x ^= y                // [3] XOR is the column sum with the carry left out
		y = carry             // [4] the carries are what is left to add to x
	}
	return int(x) // [1] no carry left, so x is the sum
}
