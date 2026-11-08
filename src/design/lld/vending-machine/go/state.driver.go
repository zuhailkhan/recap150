package lld_vending_machine

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var m *VendingMachine
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "VendingMachine":
			inv := NewInventory()
			for _, r := range a[0].([]any) {
				row := r.([]any)
				inv.AddSlot(row[0].(string), row[1].(string), int(row[2].(float64)), int(row[3].(float64)))
			}
			m = NewVendingMachine(inv)
			out = append(out, nil)
		case "insertCoin":
			out = append(out, m.InsertCoin(int(a[0].(float64))))
		case "selectItem":
			if name, ok := m.SelectItem(a[0].(string)); ok {
				out = append(out, name)
			} else {
				out = append(out, -1)
			}
		case "refund":
			out = append(out, m.Refund())
		case "restock":
			out = append(out, m.Restock(a[0].(string), int(a[1].(float64))))
		case "collectChange":
			out = append(out, m.CollectChange())
		}
	}
	return out
}
