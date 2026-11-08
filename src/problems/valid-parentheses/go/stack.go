package valid_parentheses

func isValid(s string) bool {
	pairs := map[byte]byte{')': '(', ']': '[', '}': '{'} // [1] closer -> its opener
	stack := []byte{}
	for i := 0; i < len(s); i++ {
		ch := s[i]
		if _, isCloser := pairs[ch]; !isCloser { // [2] opener: push it and wait for its partner
			stack = append(stack, ch)
			continue
		}
		// [3] closer: it must match the most recent opener
		if len(stack) == 0 || stack[len(stack)-1] != pairs[ch] {
			return false
		}
		stack = stack[:len(stack)-1]
	}
	return len(stack) == 0 // [4] nothing may be left open
}
