package letter_combinations_of_a_phone_number

var letters = [8]string{"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"} // letters for digits 2 to 9

func letterCombinations(digits string) []string {
	out := []string{}
	if digits == "" { // [1] no digits, no combinations (not even an empty one)
		return out
	}
	path := make([]byte, 0, len(digits)) // [1] one letter per digit so far
	var walk func(i int)
	walk = func(i int) {
		if i == len(digits) { // [4] one letter for every digit: save the word
			out = append(out, string(path)) // string() copies the bytes
			return
		}
		options := letters[digits[i]-'2'] // [2] the letters on this digit
		for k := 0; k < len(options); k++ {
			path = append(path, options[k]) // [3] pick this letter, then handle the next digit
			walk(i + 1)
			path = path[:len(path)-1] // [5] undo the pick, then try the next letter
		}
	}
	walk(0)
	return out // [5] all combinations
}
