package lld_food_ordering

func pt(x, y any) Point { return Point{int(x.(float64)), int(y.(float64))} }

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var svc *FoodService
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "FoodService":
			var rs []*Restaurant
			for _, row := range a[0].([]any) {
				r := row.([]any)
				rest := &Restaurant{ID: r[0].(string), At: pt(r[1], r[2]), Menu: map[string]*MenuItem{}}
				for _, it := range r[3].([]any) {
					m := it.([]any)
					rest.Menu[m[0].(string)] = &MenuItem{Name: m[1].(string), Price: int(m[2].(float64)), Stock: int(m[3].(float64))}
				}
				rs = append(rs, rest)
			}
			var partners []*Partner
			for _, row := range a[1].([]any) {
				p := row.([]any)
				partners = append(partners, &Partner{ID: p[0].(string), At: pt(p[1], p[2])})
			}
			var assign AssignStrategy = NearestPartner{}
			if a[2].(string) == "least" {
				assign = LeastDelivered{}
			}
			rules := []PriceRule{ItemTotals{}, PercentDiscount{Percent: 10, MinSubtotal: 50000, Cap: 10000}, Tax{Percent: 5}, DeliveryFee{Fee: 4000, FreeAbove: 80000}}
			svc = NewFoodService(rs, partners, rules, assign)
			out = append(out, nil)
		case "addToCart":
			out = append(out, svc.AddToCart(a[0].(string), a[1].(string), a[2].(string), int(a[3].(float64))))
		case "removeFromCart":
			out = append(out, b2i(svc.RemoveFromCart(a[0].(string), a[1].(string))))
		case "bill":
			out = append(out, svc.Bill(a[0].(string)))
		case "placeOrder":
			out = append(out, svc.PlaceOrder(a[0].(string), pt(a[1], a[2])))
		case "accept":
			out = append(out, b2i(svc.Accept(int(a[0].(float64)))))
		case "startPreparing":
			out = append(out, b2i(svc.StartPreparing(int(a[0].(float64)))))
		case "pickUp":
			out = append(out, b2i(svc.PickUp(int(a[0].(float64)))))
		case "deliver":
			out = append(out, b2i(svc.Deliver(int(a[0].(float64)))))
		case "cancel":
			out = append(out, svc.Cancel(int(a[0].(float64))))
		case "status":
			out = append(out, svc.Status(int(a[0].(float64))))
		case "stock":
			out = append(out, svc.Stock(a[0].(string), a[1].(string)))
		}
	}
	return out
}
