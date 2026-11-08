package kth_largest_element_in_a_stream

import "fmt"

// run replays the operations. JSON numbers arrive as float64. One result per operation: nil for the constructor, a number for Add.
func run(ops []string, args [][]any) []any {
	var kl *KthLargest
	out := make([]any, 0, len(ops))
	for i, op := range ops {
		a := args[i]
		switch op {
		case "KthLargest":
			nums := []int{}
			for _, v := range a[1].([]any) {
				nums = append(nums, int(v.(float64)))
			}
			kl = newKthLargest(int(a[0].(float64)), nums)
			out = append(out, nil)
		case "add":
			out = append(out, kl.Add(int(a[0].(float64))))
		default:
			panic(fmt.Sprintf("unknown operation %s", op))
		}
	}
	return out
}
