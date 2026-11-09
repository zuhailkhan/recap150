package lld_library_management

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var lib *Library
	var res *Reservations
	var out []any
	num := func(v any) int { return int(v.(float64)) }
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Library":
			books := map[string]*Book{}
			for _, r := range a[0].([]any) {
				row := r.([]any)
				books[row[0].(string)] = &Book{ID: row[0].(string), Free: num(row[1])}
			}
			members := map[string]*Member{}
			for _, m := range a[1].([]any) {
				members[m.(string)] = &Member{ID: m.(string)}
			}
			var policy FinePolicy = PerDayFine{Rate: num(a[5])}
			if a[4].(string) == "capped" {
				policy = CappedFine{Rate: num(a[5]), Cap: num(a[6])}
			}
			res = NewReservations()
			lib = NewLibrary(books, members, res, policy, num(a[2]), num(a[3]))
			out = append(out, nil)
		case "borrow":
			out = append(out, lib.Borrow(a[0].(string), a[1].(string), num(a[2])))
		case "reserve":
			out = append(out, lib.Reserve(a[0].(string), a[1].(string)))
		case "returnBook":
			if fine, ok := lib.ReturnBook(num(a[0]), num(a[1])); ok {
				out = append(out, fine)
			} else {
				out = append(out, -1)
			}
		case "dueOf":
			out = append(out, lib.DueOf(num(a[0])))
		case "count":
			out = append(out, lib.Count(a[0].(string)))
		case "queue":
			out = append(out, nonNil(res.Waiting(a[0].(string))))
		case "held":
			out = append(out, nonNil(res.Held(a[0].(string))))
		}
	}
	return out
}

func nonNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}
