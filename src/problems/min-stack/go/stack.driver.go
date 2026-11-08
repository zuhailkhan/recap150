package min_stack

func run(ops []string, args [][]int) []any {
	out := make([]any, 0, len(ops))
	s := NewMinStack()
	for i, op := range ops {
		switch op {
		case "MinStack":
			s = NewMinStack()
			out = append(out, nil)
		case "push":
			s.Push(args[i][0])
			out = append(out, nil)
		case "pop":
			s.Pop()
			out = append(out, nil)
		case "top":
			out = append(out, s.Top())
		case "getMin":
			out = append(out, s.GetMin())
		}
	}
	return out
}
