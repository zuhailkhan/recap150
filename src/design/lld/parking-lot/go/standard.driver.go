package lld_parking_lot

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var lot *ParkingLot
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "ParkingLot":
			sizes := a[0].([]any)
			spots := make([]*Spot, len(sizes))
			for id, s := range sizes {
				spots[id] = &Spot{ID: id, Size: Size(int(s.(float64)))}
			}
			var strategy SpotStrategy = NearestFree{}
			if a[1].(string) == "tightest" {
				strategy = TightestFit{}
			}
			lot = NewParkingLot(spots, strategy, HourlyBySize{Rates: map[Size]int{1: 1, 2: 2, 3: 4}})
			out = append(out, nil)
		case "park":
			v := Vehicle{Plate: a[0].(string), Size: Size(int(a[1].(float64)))}
			if t, ok := lot.Park(v, int(a[2].(float64))); ok {
				out = append(out, t.SpotID)
			} else {
				out = append(out, -1)
			}
		case "unpark":
			if fee, ok := lot.Unpark(int(a[0].(float64)), int(a[1].(float64))); ok {
				out = append(out, fee)
			} else {
				out = append(out, -1)
			}
		}
	}
	return out
}
