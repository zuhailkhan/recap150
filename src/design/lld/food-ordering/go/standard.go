package lld_food_ordering

import "slices"

// Money is whole paise (100 paise = 1 rupee). A refused operation returns false, 0, -1 or "none" and changes nothing.
type Point struct{ X, Y int }

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

func Manhattan(a, b Point) int { return abs(a.X-b.X) + abs(a.Y-b.Y) }

type Line struct {
	ItemID string
	Name   string
	Price  int // paise per unit, copied from the menu when the order is placed
	Qty    int
}

type MenuItem struct {
	Name  string
	Price int
	Stock int
}

type Restaurant struct {
	ID   string
	At   Point
	Menu map[string]*MenuItem
}

// Reserve takes every line from stock, or takes nothing.
func (r *Restaurant) Reserve(lines []Line) bool {
	for _, l := range lines {
		if m := r.Menu[l.ItemID]; m == nil || m.Stock < l.Qty {
			return false
		}
	}
	for _, l := range lines {
		r.Menu[l.ItemID].Stock -= l.Qty
	}
	return true
}

func (r *Restaurant) Release(lines []Line) {
	for _, l := range lines {
		r.Menu[l.ItemID].Stock += l.Qty
	}
}

// Cart is one customer's cart. It is bound to a single restaurant while it holds anything.
type Cart struct {
	RestaurantID string
	order        []string // item ids in the order first added
	qty          map[string]int
}

func NewCart() *Cart { return &Cart{qty: map[string]int{}} }

func (c *Cart) Add(restaurantID, itemID string, n int) bool {
	if len(c.order) > 0 && c.RestaurantID != restaurantID { // [1] one restaurant at a time
		return false
	}
	c.RestaurantID = restaurantID
	if _, ok := c.qty[itemID]; !ok {
		c.order = append(c.order, itemID)
	}
	c.qty[itemID] += n
	return true
}

func (c *Cart) Remove(itemID string) bool {
	i := slices.Index(c.order, itemID)
	if i < 0 {
		return false
	}
	c.order = slices.Delete(c.order, i, i+1)
	delete(c.qty, itemID)
	if len(c.order) == 0 {
		c.RestaurantID = "" // an empty cart belongs to no one, so the next item can pick any restaurant
	}
	return true
}

func (c *Cart) Count(itemID string) int { return c.qty[itemID] }

func (c *Cart) Clear() {
	c.order, c.qty, c.RestaurantID = nil, map[string]int{}, ""
}

type Bill struct{ Subtotal, Discount, Tax, Delivery, Total int }

// PriceRule is one step of pricing. It reads what earlier steps wrote and fills in its own field.
type PriceRule interface {
	Apply(b *Bill, lines []Line)
}

type ItemTotals struct{}

func (ItemTotals) Apply(b *Bill, lines []Line) {
	b.Subtotal = 0
	for _, l := range lines {
		b.Subtotal += l.Price * l.Qty
	}
}

// PercentDiscount takes Percent off the subtotal once it reaches MinSubtotal, never more than Cap.
type PercentDiscount struct{ Percent, MinSubtotal, Cap int }

func (d PercentDiscount) Apply(b *Bill, _ []Line) {
	if b.Subtotal >= d.MinSubtotal {
		b.Discount = min(b.Subtotal*d.Percent/100, d.Cap)
	}
}

// Tax is charged on what the customer pays for food, so after the discount. Rounded half up.
type Tax struct{ Percent int }

func (t Tax) Apply(b *Bill, _ []Line) { b.Tax = ((b.Subtotal-b.Discount)*t.Percent + 50) / 100 }

// DeliveryFee is flat, waived when the food total after discount reaches FreeAbove. Not taxed.
type DeliveryFee struct{ Fee, FreeAbove int }

func (d DeliveryFee) Apply(b *Bill, _ []Line) {
	if b.Subtotal-b.Discount >= d.FreeAbove {
		b.Delivery = 0
	} else {
		b.Delivery = d.Fee
	}
}

type OrderState string

// next lists the only legal moves. Once food is being prepared the order can no longer be cancelled.
var next = map[OrderState][]OrderState{
	"Placed":    {"Accepted", "Cancelled"},
	"Accepted":  {"Preparing", "Cancelled"},
	"Preparing": {"PickedUp"},
	"PickedUp":  {"Delivered"},
}

type Order struct {
	ID           int
	RestaurantID string
	Lines        []Line
	Bill         Bill
	Drop         Point
	State        OrderState
	PartnerID    string
}

func (o *Order) Can(to OrderState) bool { return slices.Contains(next[o.State], to) }

func (o *Order) Move(to OrderState) bool {
	if !o.Can(to) {
		return false
	}
	o.State = to
	return true
}

type Partner struct {
	ID        string
	At        Point
	Busy      bool
	Delivered int
}

// AssignStrategy chooses a free delivery partner for a restaurant. It returns nil when everyone is busy.
type AssignStrategy interface {
	Pick(partners []*Partner, restaurant Point) *Partner
}

// NearestPartner picks the closest free partner to the restaurant. Ties go to the smaller id.
type NearestPartner struct{}

func (NearestPartner) Pick(partners []*Partner, restaurant Point) *Partner {
	var best *Partner
	bestDist := 0
	for _, p := range partners {
		if p.Busy {
			continue
		}
		d := Manhattan(p.At, restaurant)
		if best == nil || d < bestDist || (d == bestDist && p.ID < best.ID) {
			best, bestDist = p, d
		}
	}
	return best
}

// LeastDelivered picks the free partner with the fewest deliveries so far, to spread the work. Ties go to the smaller id.
type LeastDelivered struct{}

func (LeastDelivered) Pick(partners []*Partner, _ Point) *Partner {
	var best *Partner
	for _, p := range partners {
		if p.Busy {
			continue
		}
		if best == nil || p.Delivered < best.Delivered || (p.Delivered == best.Delivered && p.ID < best.ID) {
			best = p
		}
	}
	return best
}

type FoodService struct {
	restaurants map[string]*Restaurant
	carts       map[string]*Cart
	orders      []*Order // order id n is orders[n-1]
	partners    []*Partner
	rules       []PriceRule
	assign      AssignStrategy
}

func NewFoodService(rs []*Restaurant, partners []*Partner, rules []PriceRule, a AssignStrategy) *FoodService {
	s := &FoodService{restaurants: map[string]*Restaurant{}, carts: map[string]*Cart{}, partners: partners, rules: rules, assign: a}
	for _, r := range rs {
		s.restaurants[r.ID] = r
	}
	return s
}

// AddToCart returns the quantity of that item now in the cart, or -1 if refused.
func (s *FoodService) AddToCart(user, restaurantID, itemID string, qty int) int {
	r := s.restaurants[restaurantID]
	if qty < 1 || r == nil || r.Menu[itemID] == nil {
		return -1
	}
	cart := s.cartOf(user)
	if !cart.Add(restaurantID, itemID, qty) {
		return -1
	}
	return cart.Count(itemID)
}

func (s *FoodService) RemoveFromCart(user, itemID string) bool { return s.cartOf(user).Remove(itemID) }

// Bill returns subtotal, discount, tax, delivery, total for the cart as it stands. An empty cart gives an empty list.
func (s *FoodService) Bill(user string) []int {
	cart := s.cartOf(user)
	if len(cart.order) == 0 {
		return []int{}
	}
	b := s.price(s.linesOf(cart))
	return []int{b.Subtotal, b.Discount, b.Tax, b.Delivery, b.Total}
}

// PlaceOrder returns the order id, or -1 if the cart is empty or the restaurant cannot fill every line.
func (s *FoodService) PlaceOrder(user string, drop Point) int {
	cart := s.cartOf(user)
	if len(cart.order) == 0 {
		return -1
	}
	lines := s.linesOf(cart)
	if !s.restaurants[cart.RestaurantID].Reserve(lines) { // [3] take all the stock or none, so nothing oversells
		return -1
	}
	o := &Order{ID: len(s.orders) + 1, RestaurantID: cart.RestaurantID, Lines: lines, Bill: s.price(lines), Drop: drop, State: "Placed"} // the price is fixed from here on
	s.orders = append(s.orders, o)
	cart.Clear()
	return o.ID
}

func (s *FoodService) order(id int) *Order {
	if id < 1 || id > len(s.orders) {
		return nil
	}
	return s.orders[id-1]
}

// Accept means the restaurant accepts and a partner is assigned. Refused if no partner is free.
func (s *FoodService) Accept(id int) bool {
	o := s.order(id)
	if o == nil || !o.Can("Accepted") {
		return false
	}
	p := s.assign.Pick(s.partners, s.restaurants[o.RestaurantID].At) // [4] ask the strategy, then claim the partner
	if p == nil {
		return false
	}
	o.Move("Accepted")
	o.PartnerID = p.ID
	p.Busy = true
	return true
}

func (s *FoodService) StartPreparing(id int) bool {
	o := s.order(id)
	return o != nil && o.Move("Preparing")
}

func (s *FoodService) PickUp(id int) bool {
	o := s.order(id)
	return o != nil && o.Move("PickedUp")
}

func (s *FoodService) Deliver(id int) bool {
	o := s.order(id)
	if o == nil || !o.Move("Delivered") {
		return false
	}
	p := s.partnerOf(o)
	p.Busy = false // [5] the partner is free at the customer's door
	p.At = o.Drop
	p.Delivered++
	return true
}

// Cancel returns the refund in paise, or -1 if the order is already being prepared, or is finished.
func (s *FoodService) Cancel(id int) int {
	o := s.order(id)
	if o == nil || !o.Move("Cancelled") {
		return -1
	}
	s.restaurants[o.RestaurantID].Release(o.Lines) // [5] the food goes back on the shelf
	if o.PartnerID != "" {
		s.partnerOf(o).Busy = false
		o.PartnerID = ""
	}
	return o.Bill.Total
}

// Status is "Accepted:p1", "Placed", or "none".
func (s *FoodService) Status(id int) string {
	o := s.order(id)
	if o == nil {
		return "none"
	}
	if o.PartnerID != "" {
		return string(o.State) + ":" + o.PartnerID
	}
	return string(o.State)
}

func (s *FoodService) Stock(restaurantID, itemID string) int {
	if r := s.restaurants[restaurantID]; r != nil && r.Menu[itemID] != nil {
		return r.Menu[itemID].Stock
	}
	return -1
}

func (s *FoodService) partnerOf(o *Order) *Partner {
	for _, p := range s.partners {
		if p.ID == o.PartnerID {
			return p
		}
	}
	return nil
}

func (s *FoodService) cartOf(user string) *Cart {
	c := s.carts[user]
	if c == nil {
		c = NewCart()
		s.carts[user] = c
	}
	return c
}

func (s *FoodService) linesOf(cart *Cart) []Line {
	menu := s.restaurants[cart.RestaurantID].Menu
	lines := make([]Line, 0, len(cart.order))
	for _, id := range cart.order {
		lines = append(lines, Line{ItemID: id, Name: menu[id].Name, Price: menu[id].Price, Qty: cart.qty[id]})
	}
	return lines
}

// price runs every rule in order, then adds up. The order of the rules is part of the price.
func (s *FoodService) price(lines []Line) Bill {
	var b Bill
	for _, rule := range s.rules {
		rule.Apply(&b, lines) // [2] a pipeline: each rule fills in its own field
	}
	b.Total = b.Subtotal - b.Discount + b.Tax + b.Delivery
	return b
}
