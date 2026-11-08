package find_median_from_data_stream

import "fmt"

// run replays the operations. JSON numbers arrive as ints here. One result per operation: nil for the constructor and AddNum, a float for FindMedian.
func run(ops []string, args [][]int) []any {
	var mf *MedianFinder
	out := make([]any, 0, len(ops))
	for i, op := range ops {
		a := args[i]
		switch op {
		case "MedianFinder":
			mf = newMedianFinder()
			out = append(out, nil)
		case "addNum":
			mf.AddNum(a[0])
			out = append(out, nil)
		case "findMedian":
			out = append(out, mf.FindMedian())
		default:
			panic(fmt.Sprintf("unknown operation %s", op))
		}
	}
	return out
}
