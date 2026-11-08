package valid_parenthesis_string

func checkValidString(s string) bool {
	lo := 0 // [1] fewest '(' that can still be open, over every way to read the stars
	hi := 0 // [1] most '(' that can still be open
	for _, ch := range s {
		switch ch {
		case '(': // [2] an opener adds one to every reading
			lo++
			hi++
		case ')': // [2] a closer removes one from every reading
			lo--
			hi--
		default: // [2] a star: ")" lowers lo, "(" raises hi, empty keeps what is between
			lo--
			hi++
		}
		if hi < 0 { // [2] even with every * as "(", closers outnumber openers: dead
			return false
		}
		if lo < 0 { // [3] a count below 0 means a ")" with nothing open. Drop those readings
			lo = 0
		}
	}
	return lo == 0 // [4] zero open is possible only if lo reached 0
}
