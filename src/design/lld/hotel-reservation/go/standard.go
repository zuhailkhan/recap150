package lld_hotel_reservation

// Days are integers. A stay is the half-open range [from, to): the guest sleeps the nights from..to-1
// and leaves on day `to`. Day 0 is a Monday. A failed call returns a negative code and changes nothing.
type Booking struct {
	ID     int
	Guest  string
	RoomID string
	From   int // check-in day, included
	To     int // check-out day, excluded
	Price  int
}

// Overlaps reports whether two half-open ranges share a night: each starts before the other ends.
func Overlaps(a0, a1, b0, b1 int) bool { return a0 < b1 && b0 < a1 } // [2] touching ends do not overlap

type Room struct {
	ID    string
	Type  string
	stays []Booking
}

func (r *Room) IsFree(from, to int) bool {
	for _, b := range r.stays {
		if Overlaps(b.From, b.To, from, to) {
			return false
		}
	}
	return true
}

func (r *Room) Add(b Booking) { r.stays = append(r.stays, b) }

func (r *Room) Remove(bookingID int) {
	kept := r.stays[:0:0]
	for _, b := range r.stays {
		if b.ID != bookingID {
			kept = append(kept, b)
		}
	}
	r.stays = kept
}

func (r *Room) Bookings() []Booking { return append([]Booking(nil), r.stays...) }

type Pricing interface {
	Nightly(roomType string, day int) int
}

// FlatRates is one rate per room type, the same every night.
type FlatRates struct{ Rates map[string]int }

func (f FlatRates) Nightly(roomType string, _ int) int { return f.Rates[roomType] }

// WeekendSurcharge wraps another Pricing and adds a percentage on Saturday and Sunday nights (day % 7 is 5 or 6).
type WeekendSurcharge struct {
	Inner   Pricing
	Percent int
}

func (w WeekendSurcharge) Nightly(roomType string, day int) int {
	rate := w.Inner.Nightly(roomType, day)
	if day%7 >= 5 {
		return rate + rate*w.Percent/100
	}
	return rate
}

type Hotel struct {
	Rooms    []*Room // [1] the hotel owns the rooms, in a fixed order, and is handed its pricing
	bookings map[int]Booking
	nextID   int
	pricing  Pricing
}

func NewHotel(rooms []*Room, pricing Pricing) *Hotel {
	return &Hotel{Rooms: rooms, bookings: map[int]Booking{}, nextID: 1, pricing: pricing}
}

// Search returns the rooms of this type with every night in [from, to) free, in room order.
// It is empty for a bad range or type.
func (h *Hotel) Search(roomType string, from, to int) []*Room {
	var out []*Room
	if from < 0 || from >= to {
		return out
	}
	for _, r := range h.Rooms { // [3] ask each room of the type
		if r.Type == roomType && r.IsFree(from, to) {
			out = append(out, r)
		}
	}
	return out
}

// check returns 0 if the range and type are fine, -2 for a bad range, -3 for an unknown type.
func (h *Hotel) check(roomType string, from, to int) int {
	if from < 0 || from >= to {
		return -2
	}
	for _, r := range h.Rooms {
		if r.Type == roomType {
			return 0
		}
	}
	return -3
}

// Quote returns the total price of the stay, or -2 for a bad range, -3 for an unknown type.
func (h *Hotel) Quote(roomType string, from, to int) int {
	if bad := h.check(roomType, from, to); bad != 0 {
		return bad
	}
	total := 0
	for day := from; day < to; day++ {
		total += h.pricing.Nightly(roomType, day) // [4] price each night
	}
	return total
}

// Book returns a booking id (1, 2, ...), or -1 nothing free, -2 bad range, -3 unknown type.
func (h *Hotel) Book(guest, roomType string, from, to int) int {
	if bad := h.check(roomType, from, to); bad != 0 {
		return bad
	}
	free := h.Search(roomType, from, to) // the first free room, in room order
	if len(free) == 0 {
		return -1
	}
	b := Booking{ID: h.nextID, Guest: guest, RoomID: free[0].ID, From: from, To: to, Price: h.Quote(roomType, from, to)}
	h.nextID++
	free[0].Add(b) // [5] the room now blocks these nights
	h.bookings[b.ID] = b
	return b.ID
}

// Cancel returns the refund (the full price). False for an unknown or already cancelled booking.
func (h *Hotel) Cancel(bookingID int) (int, bool) {
	b, ok := h.bookings[bookingID]
	if !ok {
		return 0, false
	}
	for _, r := range h.Rooms {
		if r.ID == b.RoomID {
			r.Remove(bookingID) // [6] the nights are free again
		}
	}
	delete(h.bookings, bookingID)
	return b.Price, true
}

func (h *Hotel) RoomOf(bookingID int) (string, bool) {
	b, ok := h.bookings[bookingID]
	return b.RoomID, ok
}
