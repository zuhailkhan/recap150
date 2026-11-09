package lld_splitwise

import "strconv"

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
// For an equal split the participants are plain names. For exact and percent they are [name, value] pairs.
func runOps(ops []string, args [][]any) []any {
	var g *Group
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Splitwise":
			var members []string
			for _, m := range a[0].([]any) {
				members = append(members, m.(string))
			}
			g = NewGroup(members, NewLedger(members))
			out = append(out, nil)
		case "addExpense":
			var strategy SplitStrategy = EqualSplit{}
			switch a[2].(string) {
			case "exact":
				strategy = ExactSplit{}
			case "percent":
				strategy = PercentSplit{}
			}
			var parts []Share
			for _, p := range a[3].([]any) {
				if name, ok := p.(string); ok {
					parts = append(parts, Share{User: name})
				} else {
					pair := p.([]any)
					parts = append(parts, Share{User: pair[0].(string), Value: int(pair[1].(float64))})
				}
			}
			out = append(out, b2i(g.AddExpense(a[0].(string), int(a[1].(float64)), parts, strategy)))
		case "pay":
			out = append(out, b2i(g.Pay(a[0].(string), a[1].(string), int(a[2].(float64)))))
		case "balances":
			out = append(out, g.Balances())
		case "debts":
			out = append(out, g.Debts())
		case "settle":
			lines := []string{}
			for _, p := range g.Settle() {
				lines = append(lines, p.From+">"+p.To+":"+strconv.Itoa(p.Cents))
			}
			out = append(out, lines)
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
