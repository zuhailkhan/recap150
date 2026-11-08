package generate_parentheses

func generateParenthesis(n int) []string {
	out := []string{}
	path := make([]byte, 0, 2*n) // [1] the string built so far, one character per slot
	var build func(opened, closed int)
	build = func(opened, closed int) {
		if len(path) == 2*n { // [4] every pair is used: this string is complete
			out = append(out, string(path)) // string() copies the bytes
			return
		}
		if opened < n { // [2] we may open while we still have openers left
			path = append(path, '(')
			build(opened+1, closed)
			path = path[:len(path)-1] // [5] undo this choice, then try the other one
		}
		if closed < opened { // [3] we may close only something that is open
			path = append(path, ')')
			build(opened, closed+1)
			path = path[:len(path)-1] // [5] undo this choice
		}
	}
	build(0, 0)
	return out // [5] all complete strings
}
