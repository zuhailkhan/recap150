package lld_coupon_engine

import (
	"cmp"
	"slices"
)

// All money is integer cents. Percentages round half up: (base*pct + 50) / 100 with integer division.
type Item struct {
	SKU      string
	Category string
	Unit     int
	Qty      int
}

type Cart struct{ Items []*Item }

// Add adds a line, or merges into the line with the same sku. It refuses a non-positive qty or a negative price.
func (c *Cart) Add(sku, category string, unit, qty int) bool {
	if qty <= 0 || unit < 0 {
		return false
	}
	for _, it := range c.Items {
		if it.SKU == sku {
			it.Qty += qty // [1] the same sku is one line
			return true
		}
	}
	c.Items = append(c.Items, &Item{SKU: sku, Category: category, Unit: unit, Qty: qty})
	return true
}

func (c *Cart) Subtotal() int {
	sum := 0
	for _, it := range c.Items {
		sum += it.Unit * it.Qty
	}
	return sum
}

func (c *Cart) SubtotalOf(category string) int {
	sum := 0
	for _, it := range c.Items {
		if it.Category == category {
			sum += it.Unit * it.Qty
		}
	}
	return sum
}

// Spec is a Specification: one yes/no eligibility test. Name is the reason shown when it says no.
type Spec interface {
	Name() string
	Ok(c *Cart, today int) bool
}

type MinCart struct{ Min int }

func (MinCart) Name() string             { return "below minimum" }
func (s MinCart) Ok(c *Cart, _ int) bool { return c.Subtotal() >= s.Min }

// NotExpired holds the last day the coupon works, inclusive.
type NotExpired struct{ LastDay int }

func (NotExpired) Name() string                 { return "expired" }
func (s NotExpired) Ok(_ *Cart, today int) bool { return today <= s.LastDay }

type HasCategory struct{ Category string }

func (HasCategory) Name() string { return "no matching category" }
func (s HasCategory) Ok(c *Cart, _ int) bool {
	return slices.ContainsFunc(c.Items, func(it *Item) bool { return it.Category == s.Category })
}

type UnderLimit struct {
	Code  string
	Max   int
	Usage *Usage
}

func (UnderLimit) Name() string         { return "limit reached" }
func (s UnderLimit) Ok(*Cart, int) bool { return s.Usage.Used(s.Code) < s.Max }

// Usage counts how many times each code was redeemed at checkout.
type Usage struct{ counts map[string]int }

func NewUsage() *Usage { return &Usage{counts: map[string]int{}} }

func (u *Usage) Used(code string) int { return u.counts[code] }
func (u *Usage) Redeem(code string)   { u.counts[code]++ }

// DiscountStrategy says how much a coupon takes off. payable is what is still left to pay.
type DiscountStrategy interface {
	Amount(c *Cart, payable int) int
}

// PercentOff works on what is still payable, limited to one category's lines when Category is set.
type PercentOff struct {
	Pct      int
	Category string
}

func (s PercentOff) Amount(c *Cart, payable int) int {
	base := payable
	if s.Category != "" {
		base = min(c.SubtotalOf(s.Category), payable)
	}
	return (base*s.Pct + 50) / 100
}

type FlatOff struct{ Cents int }

func (s FlatOff) Amount(*Cart, int) int { return s.Cents }

// BuyXGetY gives y free for every full group of x + y units of a sku.
type BuyXGetY struct {
	SKU  string
	X, Y int
}

func (s BuyXGetY) Amount(c *Cart, _ int) int {
	for _, it := range c.Items {
		if it.SKU == s.SKU {
			return it.Qty / (s.X + s.Y) * s.Y * it.Unit
		}
	}
	return 0
}

type Coupon struct {
	Code     string
	Priority int    // lower goes first
	Specs    []Spec // all must hold, checked in this order
	Strategy DiscountStrategy
}

type Applied struct {
	Code  string
	Cents int
}

func byPriority(a, b *Coupon) int {
	return cmp.Or(cmp.Compare(a.Priority, b.Priority), cmp.Compare(a.Code, b.Code))
}

func sorted(coupons []*Coupon) []*Coupon {
	out := slices.Clone(coupons)
	slices.SortFunc(out, byPriority)
	return out
}

// StackingPolicy takes the eligible coupons and decides which apply and for how much.
type StackingPolicy interface {
	Choose(coupons []*Coupon, c *Cart) []Applied
}

// BestSingle applies only the single biggest saving. A tie goes to the lower priority number.
type BestSingle struct{}

func (BestSingle) Choose(coupons []*Coupon, c *Cart) []Applied {
	subtotal := c.Subtotal()
	best := Applied{}
	for _, cp := range sorted(coupons) {
		cents := min(cp.Strategy.Amount(c, subtotal), subtotal) // [3] price each coupon on its own
		if cents > best.Cents {                                 // [4] strictly bigger wins
			best = Applied{cp.Code, cents}
		}
	}
	if best.Cents == 0 {
		return []Applied{}
	}
	return []Applied{best}
}

// StackInOrder applies every eligible coupon in priority order, each on what is still payable,
// up to CapPercent of the subtotal.
type StackInOrder struct{ CapPercent int }

func (p StackInOrder) Choose(coupons []*Coupon, c *Cart) []Applied {
	payable := c.Subtotal()
	allowance := payable * p.CapPercent / 100 // the most all coupons together may take
	applied := []Applied{}
	for _, cp := range sorted(coupons) { // [4] fixed priority order
		asked := cp.Strategy.Amount(c, payable) // [3] price it on the running total
		cents := min(asked, payable, allowance) // [5] never below zero, never over the cap
		if cents <= 0 {
			continue
		}
		applied = append(applied, Applied{cp.Code, cents})
		payable -= cents
		allowance -= cents
	}
	return applied
}

type Quote struct {
	Total    int
	Applied  []Applied
	Rejected []string // "CODE:reason", in the order the codes were given
}

type CouponEngine struct {
	catalog map[string]*Coupon
	policy  StackingPolicy
	usage   *Usage
}

func NewCouponEngine(coupons []*Coupon, policy StackingPolicy, usage *Usage) *CouponEngine {
	catalog := map[string]*Coupon{}
	for _, cp := range coupons {
		catalog[cp.Code] = cp
	}
	return &CouponEngine{catalog: catalog, policy: policy, usage: usage}
}

func (e *CouponEngine) Quote(c *Cart, codes []string, today int) Quote {
	eligible := []*Coupon{}
	rejected := []string{}
	seen := map[string]bool{}
	for _, code := range codes {
		coupon := e.catalog[code]
		switch {
		case coupon == nil:
			rejected = append(rejected, code+":unknown")
		case seen[code]:
			rejected = append(rejected, code+":duplicate")
		default:
			i := slices.IndexFunc(coupon.Specs, func(s Spec) bool { return !s.Ok(c, today) }) // [2] first failing spec is the reason
			if i >= 0 {
				rejected = append(rejected, code+":"+coupon.Specs[i].Name())
			} else {
				eligible = append(eligible, coupon)
			}
		}
		seen[code] = true
	}
	applied := e.policy.Choose(eligible, c)
	off := 0
	for _, a := range applied {
		off += a.Cents
	}
	return Quote{Total: c.Subtotal() - off, Applied: applied, Rejected: rejected}
}

// Checkout is Quote, then counts one use for every coupon that really took something off.
func (e *CouponEngine) Checkout(c *Cart, codes []string, today int) Quote {
	q := e.Quote(c, codes, today)
	for _, a := range q.Applied {
		e.usage.Redeem(a.Code) // [6] only applied coupons are used up
	}
	return q
}
