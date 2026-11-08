package lld_vending_machine

// Money is always whole cents (integers). A failed operation returns -1 or false and changes nothing.
type Item struct {
	Name  string
	Price int // cents
}

type Slot struct {
	Item Item
	Qty  int
}

// Inventory is the shelves. It knows what is in stock and nothing about money or states.
type Inventory struct{ slots map[string]*Slot }

func NewInventory() *Inventory { return &Inventory{slots: map[string]*Slot{}} }

func (in *Inventory) AddSlot(code, name string, price, qty int) {
	in.slots[code] = &Slot{Item: Item{Name: name, Price: price}, Qty: qty}
}

// Peek returns the item in that slot, or false if the code is unknown or the slot is empty.
func (in *Inventory) Peek(code string) (Item, bool) {
	s, ok := in.slots[code]
	if !ok || s.Qty < 1 {
		return Item{}, false
	}
	return s.Item, true
}

func (in *Inventory) Take(code string) {
	if s, ok := in.slots[code]; ok && s.Qty > 0 {
		s.Qty--
	}
}

// Add returns the new quantity, or -1 for an unknown slot or a quantity below 1.
func (in *Inventory) Add(code string, qty int) int {
	s, ok := in.slots[code]
	if !ok || qty < 1 {
		return -1
	}
	s.Qty += qty
	return s.Qty
}

func (in *Inventory) Total() int {
	n := 0
	for _, s := range in.slots {
		n += s.Qty
	}
	return n
}

// State lists every operation the machine supports. Each state answers all of them in its own way.
type State interface {
	InsertCoin(cents int) int              // new balance, or -1 if the coin is refused
	SelectItem(code string) (string, bool) // the item name, or false if nothing was sold
	Refund() int                           // cents handed back
	Restock(code string, qty int) int      // new quantity, or -1
}

// VendingMachine is the context. It owns the data and forwards every call to the current state.
type VendingMachine struct {
	Balance   int // cents inserted and not yet spent
	Tray      int // change waiting to be collected
	Inventory *Inventory
	idle      State
	hasMoney  State
	soldOut   State
	state     State
}

func NewVendingMachine(inv *Inventory) *VendingMachine {
	m := &VendingMachine{Inventory: inv}
	m.idle = &idleState{m}
	m.hasMoney = &hasMoneyState{m}
	m.soldOut = &soldOutState{m}
	m.state = m.idle // [1] start Idle, or SoldOut if the shelves are empty
	if inv.Total() == 0 {
		m.state = m.soldOut
	}
	return m
}

func (m *VendingMachine) InsertCoin(cents int) int {
	return m.state.InsertCoin(cents) // [2] no if/else here: the current state decides
}

func (m *VendingMachine) SelectItem(code string) (string, bool) { return m.state.SelectItem(code) }
func (m *VendingMachine) Refund() int                           { return m.state.Refund() }
func (m *VendingMachine) Restock(code string, qty int) int      { return m.state.Restock(code, qty) }

func (m *VendingMachine) CollectChange() int {
	c := m.Tray
	m.Tray = 0
	return c
}

func (m *VendingMachine) setState(s State) {
	m.state = s // [5] a state moves the machine by naming the next state
}

// idleState: no money inside. Waiting for a coin.
type idleState struct{ m *VendingMachine }

func (s *idleState) InsertCoin(cents int) int {
	if cents < 1 {
		return -1
	}
	s.m.Balance = cents // [3] this state accepts the coin and moves on to HasMoney
	s.m.setState(s.m.hasMoney)
	return cents
}
func (s *idleState) SelectItem(string) (string, bool) { return "", false } // pay first
func (s *idleState) Refund() int                      { return 0 }
func (s *idleState) Restock(code string, qty int) int { return s.m.Inventory.Add(code, qty) }

// hasMoneyState: money is waiting. The customer can add more, pick an item, or ask for it back.
type hasMoneyState struct{ m *VendingMachine }

func (s *hasMoneyState) InsertCoin(cents int) int {
	if cents < 1 {
		return -1
	}
	s.m.Balance += cents
	return s.m.Balance
}

func (s *hasMoneyState) SelectItem(code string) (string, bool) {
	m := s.m
	item, ok := m.Inventory.Peek(code)
	if !ok || item.Price > m.Balance { // unknown, empty, or too expensive: keep the money
		return "", false
	}
	m.Inventory.Take(code) // [4] sell it: take the item, put the difference in the tray, clear the balance
	m.Tray += m.Balance - item.Price
	m.Balance = 0
	if m.Inventory.Total() > 0 {
		m.setState(m.idle)
	} else {
		m.setState(m.soldOut)
	}
	return item.Name, true
}

func (s *hasMoneyState) Refund() int {
	back := s.m.Balance
	s.m.Balance = 0
	s.m.setState(s.m.idle)
	return back
}
func (s *hasMoneyState) Restock(code string, qty int) int { return s.m.Inventory.Add(code, qty) }

// soldOutState: nothing left to sell. Coins are refused so no one pays for nothing.
type soldOutState struct{ m *VendingMachine }

func (s *soldOutState) InsertCoin(int) int               { return -1 }
func (s *soldOutState) SelectItem(string) (string, bool) { return "", false }
func (s *soldOutState) Refund() int                      { return 0 }
func (s *soldOutState) Restock(code string, qty int) int {
	n := s.m.Inventory.Add(code, qty)
	if n >= 0 {
		s.m.setState(s.m.idle) // stock is back: open for business
	}
	return n
}
