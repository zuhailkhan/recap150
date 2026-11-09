package lld_elevator_system

import "strconv"

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var b *Building
	var out []any
	num := func(v any) int { return int(v.(float64)) }
	letter := map[State]string{Idle: "I", MovingUp: "U", MovingDown: "D", DoorsOpen: "O"}
	view := func() []string {
		s := []string{}
		for _, e := range b.Elevators {
			s = append(s, strconv.Itoa(e.Floor)+":"+letter[e.State])
		}
		return s
	}
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Building":
			var es []*Elevator
			for id, f := range a[1].([]any) {
				es = append(es, NewElevator(id, num(f)))
			}
			var s Scheduler = NearestIdle{}
			if a[2].(string) == "direction" {
				s = DirectionAware{}
			}
			b = NewBuilding(num(a[0]), es, s)
			out = append(out, nil)
		case "hall":
			c := CallDown
			if a[1].(string) == "up" {
				c = CallUp
			}
			out = append(out, b.Hall(num(a[0]), c))
		case "press":
			if b.Press(num(a[0]), num(a[1])) {
				out = append(out, 1)
			} else {
				out = append(out, 0)
			}
		case "tick":
			for n := num(a[0]); n > 0; n-- {
				b.Tick()
			}
			out = append(out, view())
		case "state":
			out = append(out, view())
		case "log":
			l := b.Log
			if l == nil {
				l = []string{}
			}
			out = append(out, l)
		}
	}
	return out
}
