package happy_number

func digitSquareSum(n int) int {
	sum := 0
	for n > 0 {
		d := n % 10
		sum += d * d // [2] square each digit and add it up
		n /= 10
	}
	return sum
}

func isHappy(n int) bool {
	seen := map[int]bool{}
	for n != 1 { // [1] stop at 1 (happy) or at a repeat (loop)
		if seen[n] {
			return false // [1] seen before: a loop
		}
		seen[n] = true // [2] remember it, then take the next step
		n = digitSquareSum(n)
	}
	return true // [1] left the loop at 1
}
