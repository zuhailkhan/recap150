package number_of_1_bits

func hammingWeight(n uint32) int {
	x := n // [1] an unsigned 32-bit copy, so no sign to worry about
	count := 0
	for x != 0 {
		x &= x - 1 // [2] x - 1 flips the lowest 1 and the zeros below it, so AND clears that 1
		count++    // [3] one 1 bit removed, so one more counted
	}
	return count // [3] x is 0, so every 1 bit has been counted
}
