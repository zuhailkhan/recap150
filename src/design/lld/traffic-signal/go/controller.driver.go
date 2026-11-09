package lld_traffic_signal

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
// "violations" returns how many ticks so far left the junction in an unsafe state.
func runOps(ops []string, args [][]any) []any {
	var j *Junction
	var out []any
	bad := 0
	num := func(v any) int { return int(v.(float64)) }
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Junction":
			j = NewJunction([]*Signal{NewSignal("NS", num(a[0]), num(a[1])), NewSignal("EW", num(a[2]), num(a[3]))}, NewCrossing(num(a[4])))
			out = append(out, nil)
		case "tick":
			for k := 0; k < num(a[0]); k++ {
				j.Tick()
				if !j.Safe() {
					bad++
				}
			}
			out = append(out, j.Look())
		case "press":
			out = append(out, j.Press())
		case "look":
			out = append(out, j.Look())
		case "violations":
			out = append(out, bad)
		}
	}
	return out
}
