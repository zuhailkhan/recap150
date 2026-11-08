package evaluate_reverse_polish_notation

import "strconv"

func evalRPN(tokens []string) int {
	stack := []int{} // [1] numbers waiting for an operator
	for _, tok := range tokens {
		switch tok {
		case "+", "-", "*", "/":
			b := stack[len(stack)-1] // [3] an operator: the top is the right operand
			a := stack[len(stack)-2] // [3] the one below is the left operand
			stack = stack[:len(stack)-2]
			var result int
			switch tok {
			case "+":
				result = a + b
			case "-":
				result = a - b
			case "*":
				result = a * b
			case "/":
				result = a / b // [1] int division already cuts toward zero
			}
			stack = append(stack, result) // [4] the answer goes back, as a new number
		default:
			n, _ := strconv.Atoi(tok) // [2] a number: push it
			stack = append(stack, n)
		}
	}
	return stack[0] // [5] one number remains
}
