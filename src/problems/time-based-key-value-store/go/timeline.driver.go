package time_based_key_value_store

// runOps replays the operations. JSON numbers arrive as float64.
func runOps(ops []string, args [][]any) []any {
	tm := Constructor()
	out := make([]any, 0, len(ops))
	for i, op := range ops {
		a := args[i]
		switch op {
		case "TimeMap":
			tm = Constructor()
			out = append(out, nil)
		case "set":
			tm.Set(a[0].(string), a[1].(string), int(a[2].(float64)))
			out = append(out, nil)
		case "get":
			out = append(out, tm.Get(a[0].(string), int(a[1].(float64))))
		}
	}
	return out
}
