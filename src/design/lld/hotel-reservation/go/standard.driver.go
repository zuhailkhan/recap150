package lld_hotel_reservation

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var h *Hotel
	var out []any
	num := func(v any) int { return int(v.(float64)) }
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Hotel":
			var rooms []*Room
			for _, r := range a[0].([]any) {
				row := r.([]any)
				rooms = append(rooms, &Room{ID: row[0].(string), Type: row[1].(string)})
			}
			rates := map[string]int{}
			for _, r := range a[1].([]any) {
				row := r.([]any)
				rates[row[0].(string)] = num(row[1])
			}
			var pricing Pricing = FlatRates{Rates: rates}
			if a[2].(string) == "weekend" {
				pricing = WeekendSurcharge{Inner: pricing, Percent: num(a[3])}
			}
			h = NewHotel(rooms, pricing)
			out = append(out, nil)
		case "quote":
			out = append(out, h.Quote(a[0].(string), num(a[1]), num(a[2])))
		case "book":
			out = append(out, h.Book(a[0].(string), a[1].(string), num(a[2]), num(a[3])))
		case "search":
			ids := []string{}
			for _, r := range h.Search(a[0].(string), num(a[1]), num(a[2])) {
				ids = append(ids, r.ID)
			}
			out = append(out, ids)
		case "cancel":
			if refund, ok := h.Cancel(num(a[0])); ok {
				out = append(out, refund)
			} else {
				out = append(out, -1)
			}
		case "roomOf":
			if id, ok := h.RoomOf(num(a[0])); ok {
				out = append(out, id)
			} else {
				out = append(out, -1)
			}
		}
	}
	return out
}
