package single_number

func singleNumber(nums []int) int {
	x := 0 // [1] running XOR. XOR with 0 changes nothing, so 0 is a safe start
	for _, n := range nums {
		x ^= n // [2] fold the number in. A number seen twice cancels itself
	}
	return x // [3] only the unpaired number survives
}
