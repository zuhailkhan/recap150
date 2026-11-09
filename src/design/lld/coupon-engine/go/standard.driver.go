package lld_coupon_engine

import "fmt"

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
//
// A coupon is [code, priority, strategy, specs]:
//
//	strategy: ["percent", pct, category or ""], ["flat", cents], ["bogo", sku, x, y]
//	specs:    ["min", cents], ["expires", lastDay], ["limit", max], ["category", name]
func runOps(ops []string, args [][]any) []any {
	var eng *CouponEngine
	cart := &Cart{}
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "CouponEngine":
			usage := NewUsage()
			var policy StackingPolicy = BestSingle{}
			if p := a[0].([]any); p[0] == "stack" {
				policy = StackInOrder{CapPercent: num(p[1])}
			}
			var coupons []*Coupon
			for _, row := range a[1].([]any) {
				r := row.([]any)
				cp := &Coupon{Code: r[0].(string), Priority: num(r[1])}
				s := r[2].([]any)
				switch s[0] {
				case "percent":
					cp.Strategy = PercentOff{Pct: num(s[1]), Category: s[2].(string)}
				case "flat":
					cp.Strategy = FlatOff{Cents: num(s[1])}
				case "bogo":
					cp.Strategy = BuyXGetY{SKU: s[1].(string), X: num(s[2]), Y: num(s[3])}
				}
				for _, sp := range r[3].([]any) {
					d := sp.([]any)
					switch d[0] {
					case "min":
						cp.Specs = append(cp.Specs, MinCart{Min: num(d[1])})
					case "expires":
						cp.Specs = append(cp.Specs, NotExpired{LastDay: num(d[1])})
					case "limit":
						cp.Specs = append(cp.Specs, UnderLimit{Code: cp.Code, Max: num(d[1]), Usage: usage})
					case "category":
						cp.Specs = append(cp.Specs, HasCategory{Category: d[1].(string)})
					}
				}
				coupons = append(coupons, cp)
			}
			eng = NewCouponEngine(coupons, policy, usage)
			cart = &Cart{}
			out = append(out, nil)
		case "add":
			ok := cart.Add(a[0].(string), a[1].(string), num(a[2]), num(a[3]))
			if ok {
				out = append(out, 1)
			} else {
				out = append(out, 0)
			}
		case "quote", "checkout":
			var codes []string
			for _, c := range a[0].([]any) {
				codes = append(codes, c.(string))
			}
			var q Quote
			if op == "quote" {
				q = eng.Quote(cart, codes, num(a[1]))
			} else {
				q = eng.Checkout(cart, codes, num(a[1]))
			}
			applied := []string{}
			for _, x := range q.Applied {
				applied = append(applied, fmt.Sprintf("%s:%d", x.Code, x.Cents))
			}
			out = append(out, []any{q.Total, applied, q.Rejected})
		}
	}
	return out
}

func num(v any) int { return int(v.(float64)) }
