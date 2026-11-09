package lld_movie_booking

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var svc *BookingService
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "BookingService":
			shows := map[int]*Show{}
			for k, l := range a[0].([]any) {
				var layout []Category
				for _, c := range l.(string) {
					if c == 'P' {
						layout = append(layout, Premium)
					} else {
						layout = append(layout, Regular)
					}
				}
				shows[k+1] = NewShow(k+1, "Movie", Screen{Layout: layout})
			}
			var pricing Pricing = ByCategory{Rates: map[Category]int{Regular: 100, Premium: 200}}
			if a[2].(string) == "peak" {
				pricing = PeakSurcharge{Inner: pricing, Percent: 50}
			}
			svc = NewBookingService(shows, pricing, num(a[1]))
			out = append(out, nil)
		case "hold":
			out = append(out, svc.Hold(num(a[0]), a[1].(string), ints(a[2]), num(a[3])))
		case "confirm":
			if b, ok := svc.Confirm(num(a[0]), a[1].(string), num(a[2])); ok {
				out = append(out, b.Total)
			} else {
				out = append(out, -1)
			}
		case "release":
			if svc.Release(num(a[0]), a[1].(string)) {
				out = append(out, 1)
			} else {
				out = append(out, 0)
			}
		case "cancel":
			out = append(out, svc.Cancel(num(a[0]), a[1].(string)))
		case "available":
			out = append(out, svc.Available(num(a[0]), num(a[1])))
		case "state":
			out = append(out, string(svc.StateOf(num(a[0]), num(a[1]), num(a[2]))))
		}
	}
	return out
}

func num(v any) int { return int(v.(float64)) }

func ints(v any) []int {
	out := []int{}
	for _, x := range v.([]any) {
		out = append(out, num(x))
	}
	return out
}
