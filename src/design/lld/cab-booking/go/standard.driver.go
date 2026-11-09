package lld_cab_booking

func pt(x, y any) Point { return Point{int(x.(float64)), int(y.(float64))} }

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var svc *CabService
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "CabService":
			var m MatchingStrategy = NearestDriver{}
			if a[0].(string) == "first" {
				m = FirstFree{}
			}
			svc = NewCabService(m, DistanceFare{Base: int(a[1].(float64)), PerUnit: int(a[2].(float64))})
			out = append(out, nil)
		case "addDriver":
			out = append(out, b2i(svc.AddDriver(a[0].(string), pt(a[1], a[2]))))
		case "setAvailable":
			out = append(out, b2i(svc.SetAvailable(a[0].(string), a[1].(float64) == 1)))
		case "requestRide":
			out = append(out, svc.RequestRide(a[0].(string), pt(a[1], a[2]), pt(a[3], a[4]), int(a[5].(float64))))
		case "startTrip":
			out = append(out, b2i(svc.StartTrip(int(a[0].(float64)))))
		case "endTrip":
			out = append(out, svc.EndTrip(int(a[0].(float64))))
		case "cancel":
			out = append(out, b2i(svc.Cancel(int(a[0].(float64)))))
		case "status":
			out = append(out, svc.Status(int(a[0].(float64))))
		}
	}
	return out
}

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}
