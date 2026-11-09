package lld_atm

import "errors"

// Money is whole currency units (integers). A refused operation changes nothing.
type Note struct{ Denom, N int }

type Verdict string

const (
	PinOK      Verdict = "ok"
	PinWrong   Verdict = "wrong"
	PinLocked  Verdict = "locked"
	PinRefused Verdict = "refused" // no card in, or already signed in
)

var (
	ErrState  = errors.New("state")
	ErrAmount = errors.New("amount")
	ErrLimit  = errors.New("limit")
	ErrFunds  = errors.New("funds")
	ErrCash   = errors.New("cash")
)

type Account struct {
	Pin       string
	Balance   int
	Fails     int
	Withdrawn int
	Locked    bool
}

// Bank holds PINs, balances, the failure count and the withdrawal limit. It knows nothing about notes.
type Bank struct {
	Accounts        map[string]*Account
	maxFails, limit int
}

func NewBank(maxFails, limit int) *Bank {
	return &Bank{Accounts: map[string]*Account{}, maxFails: maxFails, limit: limit}
}

func (b *Bank) AddAccount(card, pin string, balance int) {
	b.Accounts[card] = &Account{Pin: pin, Balance: balance}
}

func (b *Bank) Usable(card string) bool {
	a, ok := b.Accounts[card]
	return ok && !a.Locked
}

// Verify keeps the lockout here, not in the session, so pulling the card out and putting it back does not reset it.
func (b *Bank) Verify(card, pin string) Verdict {
	a, ok := b.Accounts[card]
	if !ok || a.Locked {
		return PinLocked
	}
	if a.Pin == pin {
		a.Fails = 0
		return PinOK
	}
	a.Fails++
	if a.Fails >= b.maxFails {
		a.Locked = true
		return PinLocked
	}
	return PinWrong
}

func (b *Bank) Balance(card string) (int, bool) {
	a, ok := b.Accounts[card]
	if !ok {
		return 0, false
	}
	return a.Balance, true
}

// Check returns nil, or why this much cannot be taken.
func (b *Bank) Check(card string, amount int) error {
	a := b.Accounts[card]
	if a.Withdrawn+amount > b.limit {
		return ErrLimit
	}
	if amount > a.Balance {
		return ErrFunds
	}
	return nil
}

func (b *Bank) Debit(card string, amount int) {
	a := b.Accounts[card]
	a.Balance -= amount
	a.Withdrawn += amount
}

// noteHandler is one link in the chain: one denomination. It takes what it can and hands the rest on.
type noteHandler struct {
	denom, stock int
	next         *noteHandler
}

// plan only records what it would take. It never touches the stock. ok is true if the whole amount can be made.
func (h *noteHandler) plan(amount int, out []Note) ([]Note, bool) {
	n := min(amount/h.denom, h.stock) // [4] as many of my note as fit and are in stock
	if n > 0 {
		out = append(out, Note{h.denom, n})
	}
	rest := amount - n*h.denom
	if rest == 0 {
		return out, true
	}
	if h.next == nil {
		return out, false
	}
	return h.next.plan(rest, out) // pass the rest down the chain
}

// Dispenser builds the chain from the stock (highest denomination first) and pays out.
type Dispenser struct{ handlers []*noteHandler }

func NewDispenser() *Dispenser { return &Dispenser{} }

// AddNote appends a link. Call it from the highest denomination to the lowest.
func (d *Dispenser) AddNote(denom, count int) {
	h := &noteHandler{denom: denom, stock: count}
	if n := len(d.handlers); n > 0 {
		d.handlers[n-1].next = h
	}
	d.handlers = append(d.handlers, h)
}

// Dispense returns the notes paid out, or false if the amount cannot be made. On false nothing has changed.
func (d *Dispenser) Dispense(amount int) ([]Note, bool) {
	if len(d.handlers) == 0 {
		return nil, false
	}
	plan, ok := d.handlers[0].plan(amount, nil)
	if !ok {
		return nil, false
	}
	for _, t := range plan { // [5] the plan worked: now take the notes
		for _, h := range d.handlers {
			if h.denom == t.Denom {
				h.stock -= t.N
			}
		}
	}
	return plan, true
}

// State lists every operation the machine supports. Each state answers all of them in its own way.
type State interface {
	InsertCard(card string) bool // true if the card was taken in
	EnterPin(pin string) Verdict
	Withdraw(amount int) ([]Note, error)
	Balance() (int, bool) // false unless signed in
	Eject() bool          // true if a card was handed back
}

// ATM is the context. It owns the session and forwards every call to the current state.
type ATM struct {
	Card      string // the card in the slot, "" if none
	Bank      *Bank
	Dispenser *Dispenser
	idle      State
	cardIn    State
	authed    State
	state     State
}

func NewATM(bank *Bank, d *Dispenser) *ATM {
	m := &ATM{Bank: bank, Dispenser: d}
	m.idle = &idleState{m}
	m.cardIn = &cardInState{m}
	m.authed = &authedState{m}
	m.state = m.idle // [1] a machine with no card in it
	return m
}

func (m *ATM) InsertCard(card string) bool {
	return m.state.InsertCard(card) // [2] no if/else here: the current state decides
}

func (m *ATM) EnterPin(pin string) Verdict         { return m.state.EnterPin(pin) }
func (m *ATM) Withdraw(amount int) ([]Note, error) { return m.state.Withdraw(amount) }
func (m *ATM) CheckBalance() (int, bool)           { return m.state.Balance() }
func (m *ATM) Eject() bool                         { return m.state.Eject() }

func (m *ATM) setState(s State) {
	m.state = s // [6] a state moves the machine by naming the next state
}

// idleState: no card. Waiting for one.
type idleState struct{ m *ATM }

func (s *idleState) InsertCard(card string) bool {
	if !s.m.Bank.Usable(card) { // unknown or locked card
		return false
	}
	s.m.Card = card
	s.m.setState(s.m.cardIn)
	return true
}
func (s *idleState) EnterPin(string) Verdict      { return PinRefused }
func (s *idleState) Withdraw(int) ([]Note, error) { return nil, ErrState }
func (s *idleState) Balance() (int, bool)         { return 0, false }
func (s *idleState) Eject() bool                  { return false }

// cardInState: a card is in, the PIN is not yet right.
type cardInState struct{ m *ATM }

func (s *cardInState) InsertCard(string) bool { return false }
func (s *cardInState) EnterPin(pin string) Verdict {
	v := s.m.Bank.Verify(s.m.Card, pin) // [3] the bank counts the failures and does the lockout
	switch v {
	case PinOK:
		s.m.setState(s.m.authed)
	case PinLocked:
		s.end() // the machine keeps the card
	}
	return v
}
func (s *cardInState) Withdraw(int) ([]Note, error) { return nil, ErrState }
func (s *cardInState) Balance() (int, bool)         { return 0, false }
func (s *cardInState) Eject() bool {
	s.end()
	return true
}
func (s *cardInState) end() {
	s.m.Card = ""
	s.m.setState(s.m.idle)
}

// authedState: signed in. Money operations are allowed.
type authedState struct{ m *ATM }

func (s *authedState) InsertCard(string) bool  { return false }
func (s *authedState) EnterPin(string) Verdict { return PinRefused }
func (s *authedState) Withdraw(amount int) ([]Note, error) {
	m := s.m
	if amount < 1 {
		return nil, ErrAmount
	}
	if err := m.Bank.Check(m.Card, amount); err != nil { // account rules first: limit and balance
		return nil, err
	}
	notes, ok := m.Dispenser.Dispense(amount) // then the chain: can the cash be made?
	if !ok {
		return nil, ErrCash
	}
	m.Bank.Debit(m.Card, amount) // debit only after the notes are out
	return notes, nil
}
func (s *authedState) Balance() (int, bool) { return s.m.Bank.Balance(s.m.Card) }
func (s *authedState) Eject() bool {
	s.m.Card = ""
	s.m.setState(s.m.idle)
	return true
}
