package reverse_bits

func reverseBits(n uint32, width int) uint32 {
	var result uint32 // [1] the reversed number, built one bit at a time
	for i := 0; i < width; i++ {
		bit := n & 1             // [2] the lowest bit of n
		result = result<<1 | bit // [3] make room on the right of the result and drop the bit in
		n >>= 1                  // [3] the next bit of n is now the lowest
	}
	return result // [4] uint32 is already unsigned
}
