package multiply_strings

func multiply(num1 string, num2 string) string {
	m, n := len(num1), len(num2)
	res := make([]int, m+n)       // [1] a product has at most m + n digits
	for i := m - 1; i >= 0; i-- { // [2] each digit of num1, right to left
		for j := n - 1; j >= 0; j-- {
			// digits are ASCII, so a byte minus '0' is the digit value
			p := int(num1[i]-'0')*int(num2[j]-'0') + res[i+j+1] // [3] digit product plus what the ones slot already holds
			res[i+j+1] = p % 10                                 // [3] the ones digit stays in slot i+j+1
			res[i+j] += p / 10                                  // [3] the tens digit carries into slot i+j
		}
	}
	k := 0
	for k < len(res)-1 && res[k] == 0 {
		k++ // [4] skip leading zeros, but keep at least one digit
	}
	out := make([]byte, 0, len(res)-k)
	for _, d := range res[k:] {
		out = append(out, byte('0'+d))
	}
	return string(out)
}
