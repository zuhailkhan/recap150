package lld_online_shopping

// Money is whole cents. A refused operation returns 0, -1 or "none" and changes nothing.
type Product struct {
	Name  string
	Price int // cents
}

// Line is what the customer is buying: the price is copied from the catalog at checkout.
type Line struct {
	SKU   string
	Qty   int
	Price int
}

type Cart struct {
	order []string // skus in the order first added
	qty   map[string]int
}

func NewCart() *Cart { return &Cart{qty: map[string]int{}} }

func (c *Cart) Add(sku string, n int) int {
	if _, ok := c.qty[sku]; !ok {
		c.order = append(c.order, sku)
	}
	c.qty[sku] += n
	return c.qty[sku]
}

func (c *Cart) Remove(sku string) bool {
	if _, ok := c.qty[sku]; !ok {
		return false
	}
	delete(c.qty, sku)
	for i, s := range c.order {
		if s == sku {
			c.order = append(c.order[:i], c.order[i+1:]...)
			break
		}
	}
	return true
}

func (c *Cart) Clear() { c.order, c.qty = nil, map[string]int{} }

type level struct{ onHand, reserved int }

// Inventory tracks units on the shelf and units promised to someone who has not paid yet.
type Inventory struct {
	stock    map[string]*level
	holds    map[int][]Line
	nextHold int
}

func NewInventory() *Inventory {
	return &Inventory{stock: map[string]*level{}, holds: map[int][]Line{}, nextHold: 1}
}

func (v *Inventory) AddStock(sku string, onHand int) { v.stock[sku] = &level{onHand: onHand} }

func (v *Inventory) Available(sku string) int {
	if s := v.stock[sku]; s != nil {
		return s.onHand - s.reserved
	}
	return 0
}

// Reserve is all or nothing. It returns a hold id, or 0 if any line is short.
// The units stay on hand, but nobody else can reserve them.
func (v *Inventory) Reserve(lines []Line) int {
	for _, l := range lines {
		if v.Available(l.SKU) < l.Qty {
			return 0
		}
	}
	for _, l := range lines {
		v.stock[l.SKU].reserved += l.Qty
	}
	id := v.nextHold
	v.nextHold++
	v.holds[id] = lines
	return id
}

// Confirm means payment succeeded: the held units are sold.
func (v *Inventory) Confirm(hold int) {
	for _, l := range v.holds[hold] {
		v.stock[l.SKU].onHand -= l.Qty
		v.stock[l.SKU].reserved -= l.Qty
	}
	delete(v.holds, hold)
}

// Release means payment failed or checkout was abandoned: the held units are for sale again.
func (v *Inventory) Release(hold int) {
	for _, l := range v.holds[hold] {
		v.stock[l.SKU].reserved -= l.Qty
	}
	delete(v.holds, hold)
}

// Restock brings sold units back, after a refund.
func (v *Inventory) Restock(lines []Line) {
	for _, l := range lines {
		v.stock[l.SKU].onHand += l.Qty
	}
}

// Levels returns [on hand, reserved], or an empty list for an unknown sku.
func (v *Inventory) Levels(sku string) []int {
	if s := v.stock[sku]; s != nil {
		return []int{s.onHand, s.reserved}
	}
	return []int{}
}

// PaymentStrategy is one way to pay. The shop knows nothing about limits or balances.
type PaymentStrategy interface {
	Charge(cents int) bool
	Refund(cents int)
}

// CardPayment approves anything up to its limit. Refunds go back to the card, outside this model.
type CardPayment struct{ Limit int }

func (c CardPayment) Charge(cents int) bool { return cents <= c.Limit }
func (CardPayment) Refund(int)              {}

type WalletPayment struct{ Balance int }

func (w *WalletPayment) Charge(cents int) bool {
	if cents > w.Balance {
		return false
	}
	w.Balance -= cents
	return true
}

func (w *WalletPayment) Refund(cents int) { w.Balance += cents }

type OrderState string

type Order struct {
	ID     int
	User   string
	Lines  []Line
	Total  int
	Hold   int
	State  OrderState
	Method string // how it was paid, once it is paid
}

type Shop struct {
	catalog   map[string]Product
	inventory *Inventory
	customers map[string]map[string]PaymentStrategy
	carts     map[string]*Cart
	orders    []*Order // order id n is orders[n-1]
}

func NewShop(catalog map[string]Product, inv *Inventory, customers map[string]map[string]PaymentStrategy) *Shop {
	return &Shop{catalog: catalog, inventory: inv, customers: customers, carts: map[string]*Cart{}}
}

// AddToCart returns the quantity of that product now in the cart, or -1. Nothing is reserved yet.
func (s *Shop) AddToCart(user, sku string, qty int) int {
	_, known := s.customers[user]
	_, listed := s.catalog[sku]
	if qty < 1 || !known || !listed {
		return -1
	}
	return s.cartOf(user).Add(sku, qty) // [1] a cart is only a wish list, so stock is not touched
}

func (s *Shop) RemoveFromCart(user, sku string) bool { return s.cartOf(user).Remove(sku) }

func (s *Shop) CartTotal(user string) int { return total(s.linesOf(s.cartOf(user))) }

// Checkout returns the order id, or 0 if the cart is empty or any line is short. The cart moves into a Pending order.
func (s *Shop) Checkout(user string) int {
	cart := s.cartOf(user)
	lines := s.linesOf(cart)
	if len(lines) == 0 {
		return 0
	}
	hold := s.inventory.Reserve(lines) // [2] hold every line or none, so two buyers cannot both get the last unit
	if hold == 0 {
		return 0
	}
	cart.Clear()
	o := &Order{ID: len(s.orders) + 1, User: user, Lines: lines, Total: total(lines), Hold: hold, State: "Pending"}
	s.orders = append(s.orders, o)
	return o.ID
}

func (s *Shop) order(id int) *Order {
	if id < 1 || id > len(s.orders) {
		return nil
	}
	return s.orders[id-1]
}

// Pay returns 1 paid, 0 declined, -1 not payable (unknown order, not Pending, or unknown method).
func (s *Shop) Pay(orderID int, method string) int {
	o := s.order(orderID)
	if o == nil || o.State != "Pending" {
		return -1
	}
	how := s.customers[o.User][method]
	if how == nil {
		return -1
	}
	if !how.Charge(o.Total) { // [3] ask the strategy. Card or wallet, the shop cannot tell
		s.inventory.Release(o.Hold) // [5] declined: the units go back on sale
		s.refill(o)
		o.State = "PaymentFailed"
		return 0
	}
	s.inventory.Confirm(o.Hold) // [4] paid: the held units become sold
	o.State = "Paid"
	o.Method = method
	return 1
}

// Cancel returns the cents refunded, or -1 if the order cannot be cancelled. A Pending order refunds 0.
func (s *Shop) Cancel(orderID int) int {
	o := s.order(orderID)
	switch {
	case o != nil && o.State == "Pending":
		s.inventory.Release(o.Hold) // [5] abandoned checkout: free the hold
		s.refill(o)
		o.State = "Cancelled"
		return 0
	case o != nil && o.State == "Paid":
		s.customers[o.User][o.Method].Refund(o.Total)
		s.inventory.Restock(o.Lines)
		o.State = "Cancelled"
		return o.Total
	}
	return -1
}

func (s *Shop) Status(orderID int) string {
	if o := s.order(orderID); o != nil {
		return string(o.State)
	}
	return "none"
}

// Stock returns [on hand, reserved], or an empty list for an unknown sku.
func (s *Shop) Stock(sku string) []int { return s.inventory.Levels(sku) }

// refill puts a failed or abandoned order's items back in the cart.
func (s *Shop) refill(o *Order) {
	cart := s.cartOf(o.User)
	for _, l := range o.Lines {
		cart.Add(l.SKU, l.Qty)
	}
}

func (s *Shop) cartOf(user string) *Cart {
	c := s.carts[user]
	if c == nil {
		c = NewCart()
		s.carts[user] = c
	}
	return c
}

func (s *Shop) linesOf(c *Cart) []Line {
	lines := make([]Line, 0, len(c.order))
	for _, sku := range c.order {
		lines = append(lines, Line{SKU: sku, Qty: c.qty[sku], Price: s.catalog[sku].Price})
	}
	return lines
}

func total(lines []Line) int {
	sum := 0
	for _, l := range lines {
		sum += l.Price * l.Qty
	}
	return sum
}
