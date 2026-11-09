package lld_online_shopping

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var shop *Shop
	wallets := map[string]*WalletPayment{}
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Shop":
			catalog := map[string]Product{}
			inv := NewInventory()
			for _, row := range a[0].([]any) {
				r := row.([]any)
				catalog[r[0].(string)] = Product{Name: r[1].(string), Price: int(r[2].(float64))}
				inv.AddStock(r[0].(string), int(r[3].(float64)))
			}
			customers := map[string]map[string]PaymentStrategy{}
			for _, row := range a[1].([]any) {
				r := row.([]any)
				w := &WalletPayment{Balance: int(r[2].(float64))}
				wallets[r[0].(string)] = w
				customers[r[0].(string)] = map[string]PaymentStrategy{"card": CardPayment{Limit: int(r[1].(float64))}, "wallet": w}
			}
			shop = NewShop(catalog, inv, customers)
			out = append(out, nil)
		case "addToCart":
			out = append(out, shop.AddToCart(a[0].(string), a[1].(string), int(a[2].(float64))))
		case "removeFromCart":
			out = append(out, b2i(shop.RemoveFromCart(a[0].(string), a[1].(string))))
		case "cartTotal":
			out = append(out, shop.CartTotal(a[0].(string)))
		case "checkout":
			out = append(out, shop.Checkout(a[0].(string)))
		case "pay":
			out = append(out, shop.Pay(int(a[0].(float64)), a[1].(string)))
		case "cancel":
			out = append(out, shop.Cancel(int(a[0].(float64))))
		case "status":
			out = append(out, shop.Status(int(a[0].(float64))))
		case "stock":
			out = append(out, shop.Stock(a[0].(string)))
		case "wallet":
			out = append(out, wallets[a[0].(string)].Balance)
		}
	}
	return out
}
