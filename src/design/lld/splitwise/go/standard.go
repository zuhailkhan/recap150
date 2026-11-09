package lld_splitwise

import (
	"errors"
	"slices"
	"strconv"
)

// Share is one person in an expense. What Value means depends on the strategy: ignored, cents or percent.
type Share struct {
	User  string
	Value int
}

type Payment struct {
	From, To string
	Cents    int
}

// SplitStrategy divides an amount. It returns cents per participant, in the same order, or an error if the input is invalid.
type SplitStrategy interface {
	Split(amount int, parts []Share) ([]int, error)
}

func sum(xs []int) int {
	t := 0
	for _, x := range xs {
		t += x
	}
	return t
}

// topUp is the rounding rule: when floors leave cents over, each of the first participants, in the given order, gets one more.
func topUp(shares []int, amount int) []int {
	left := amount - sum(shares)
	for i := range shares {
		if left > 0 {
			shares[i]++
			left--
		}
	}
	return shares
}

type EqualSplit struct{}

func (EqualSplit) Split(amount int, parts []Share) ([]int, error) {
	shares := make([]int, len(parts))
	for i := range shares {
		shares[i] = amount / len(parts)
	}
	return topUp(shares, amount), nil
}

type ExactSplit struct{}

func (ExactSplit) Split(amount int, parts []Share) ([]int, error) {
	cents := make([]int, len(parts))
	for i, p := range parts {
		if p.Value < 0 {
			return nil, errors.New("amounts must not be negative")
		}
		cents[i] = p.Value
	}
	if sum(cents) != amount {
		return nil, errors.New("amounts must add up to the total")
	}
	return cents, nil
}

type PercentSplit struct{}

func (PercentSplit) Split(amount int, parts []Share) ([]int, error) {
	shares := make([]int, len(parts))
	total := 0
	for i, p := range parts {
		if p.Value <= 0 {
			return nil, errors.New("percentages must be above 0")
		}
		total += p.Value
		shares[i] = amount * p.Value / 100
	}
	if total != 100 {
		return nil, errors.New("percentages must add up to 100")
	}
	return topUp(shares, amount), nil
}

// Ledger records who owes whom. owes[i][j] is what member i owes member j.
// At most one of owes[i][j] and owes[j][i] is above 0.
type Ledger struct {
	members []string
	owes    [][]int
}

func NewLedger(members []string) *Ledger {
	owes := make([][]int, len(members))
	for i := range owes {
		owes[i] = make([]int, len(members))
	}
	return &Ledger{members: members, owes: owes}
}

// Transfer says debtor now owes creditor cents more. Debts in the opposite direction are cancelled first.
func (l *Ledger) Transfer(debtor, creditor string, cents int) {
	i, j := slices.Index(l.members, debtor), slices.Index(l.members, creditor)
	if i == j || cents == 0 {
		return
	}
	net := l.owes[i][j] - l.owes[j][i] + cents // above 0: i owes j
	l.owes[i][j] = max(net, 0)
	l.owes[j][i] = max(-net, 0)
}

// Nets gives, per member, what others owe them minus what they owe. Above 0 is owed money. The total is always 0.
func (l *Ledger) Nets() []int {
	nets := make([]int, len(l.members))
	for i := range l.members {
		for j := range l.members {
			nets[i] += l.owes[j][i] - l.owes[i][j]
		}
	}
	return nets
}

// Debts lists every open debt: debtor in member order, then creditor in member order.
func (l *Ledger) Debts() []Payment {
	out := []Payment{}
	for i, from := range l.members {
		for j, to := range l.members {
			if l.owes[i][j] > 0 {
				out = append(out, Payment{from, to, l.owes[i][j]})
			}
		}
	}
	return out
}

// MinimizePayments is greedy: the biggest debtor pays the biggest creditor, as much as settles one of them.
// Ties go to the earlier member.
func MinimizePayments(members []string, balance []int) []Payment {
	bal := slices.Clone(balance)
	out := []Payment{}
	for {
		c, d := 0, 0
		for i, b := range bal {
			if b > bal[c] {
				c = i
			}
			if b < bal[d] {
				d = i
			}
		}
		if bal[c] <= 0 || bal[d] >= 0 {
			return out
		}
		cents := min(bal[c], -bal[d])
		out = append(out, Payment{members[d], members[c], cents}) // [4] one payment clears at least one person
		bal[c] -= cents
		bal[d] += cents
	}
}

type Group struct {
	members []string
	ledger  *Ledger
}

func NewGroup(members []string, ledger *Ledger) *Group {
	return &Group{members: members, ledger: ledger}
}

// AddExpense takes amounts in whole cents. It returns false, and records nothing, if the expense is invalid.
func (g *Group) AddExpense(payer string, amount int, parts []Share, strategy SplitStrategy) bool {
	known := func(u string) bool { return slices.Contains(g.members, u) }
	if !known(payer) || amount <= 0 || len(parts) == 0 { // [1] check who and how much
		return false
	}
	seen := map[string]bool{}
	for _, p := range parts {
		if !known(p.User) || seen[p.User] {
			return false
		}
		seen[p.User] = true
	}
	shares, err := strategy.Split(amount, parts) // [2] the strategy decides each person's cents
	if err != nil {
		return false
	}
	for i, p := range parts {
		g.ledger.Transfer(p.User, payer, shares[i]) // [3] each participant owes the payer their share
	}
	return true
}

// Pay records a payment that already happened: from paid cents to the other member.
func (g *Group) Pay(from, to string, cents int) bool {
	if !slices.Contains(g.members, from) || !slices.Contains(g.members, to) || from == to || cents <= 0 {
		return false
	}
	g.ledger.Transfer(to, from, cents)
	return true
}

func (g *Group) Balances() []string {
	out := []string{}
	for i, n := range g.ledger.Nets() {
		out = append(out, g.members[i]+":"+strconv.Itoa(n))
	}
	return out
}

func (g *Group) Debts() []string {
	out := []string{}
	for _, d := range g.ledger.Debts() {
		out = append(out, d.From+">"+d.To+":"+strconv.Itoa(d.Cents))
	}
	return out
}

// Settle is a plan only. It changes nothing until someone calls Pay.
func (g *Group) Settle() []Payment { return MinimizePayments(g.members, g.ledger.Nets()) }
