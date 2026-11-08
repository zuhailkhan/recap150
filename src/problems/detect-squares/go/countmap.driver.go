package detect_squares

import "fmt"

// run replays the operations. One result per operation: nil for the constructor and Add, a number for Count.
func run(ops []string, args [][]int) []any {
	var ds *DetectSquares
	out := make([]any, 0, len(ops))
	for i, op := range ops {
		switch op {
		case "DetectSquares":
			ds = newDetectSquares()
			out = append(out, nil)
		case "add":
			ds.Add(args[i])
			out = append(out, nil)
		case "count":
			out = append(out, ds.Count(args[i]))
		default:
			panic(fmt.Sprintf("unknown operation %s", op))
		}
	}
	return out
}
