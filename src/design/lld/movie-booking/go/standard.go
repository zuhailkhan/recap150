package lld_movie_booking

// Time is an integer (say, minutes) passed in by the caller. A hold is live while now < Until.
type Category string

const (
	Regular Category = "regular"
	Premium Category = "premium"
)

type SeatState string

const (
	Available SeatState = "available"
	Held      SeatState = "held"
	Booked    SeatState = "booked"
)

type Screen struct {
	Name   string
	Layout []Category // seat 1 is Layout[0], seat 2 is Layout[1], and so on
}

// Seat is one seat in one show. It owns the Available -> Held -> Booked state machine.
type Seat struct {
	ID       int
	Category Category
	State    SeatState
	HoldID   int
	Until    int
}

func (s *Seat) expire(now int) {
	if s.State == Held && s.Until <= now {
		s.free() // [2] a lapsed hold frees the seat
	}
}

func (s *Seat) hold(holdID, until int) { s.State, s.HoldID, s.Until = Held, holdID, until }
func (s *Seat) book()                  { s.State = Booked }
func (s *Seat) free()                  { s.State, s.HoldID = Available, 0 }

// Show is a movie on one screen. Its seats are made fresh, so each show sells its own seats.
type Show struct {
	ID    int
	Movie string
	Seats []*Seat
}

func NewShow(id int, movie string, screen Screen) *Show {
	show := &Show{ID: id, Movie: movie}
	for i, c := range screen.Layout {
		show.Seats = append(show.Seats, &Seat{ID: i + 1, Category: c, State: Available})
	}
	return show
}

// pick returns the seats for these ids, or nil if the list is empty, has a duplicate or names a missing seat.
func (sh *Show) pick(ids []int) []*Seat {
	seen := map[int]bool{}
	var seats []*Seat
	for _, id := range ids {
		if id < 1 || id > len(sh.Seats) || seen[id] {
			return nil
		}
		seen[id] = true
		seats = append(seats, sh.Seats[id-1])
	}
	return seats
}

func (sh *Show) Sweep(now int) {
	for _, s := range sh.Seats {
		s.expire(now)
	}
}

// Hold is all or nothing: every seat must be available, or none is touched.
func (sh *Show) Hold(ids []int, holdID, until int) []*Seat {
	seats := sh.pick(ids)
	if len(seats) == 0 {
		return nil
	}
	for _, s := range seats {
		if s.State != Available {
			return nil
		}
	}
	for _, s := range seats {
		s.hold(holdID, until) // [3] Available -> Held, in one step with the check
	}
	return seats
}

// Book turns Held into Booked, but only for seats still held by this very hold.
func (sh *Show) Book(ids []int, holdID int) bool {
	seats := sh.pick(ids)
	if len(seats) == 0 {
		return false
	}
	for _, s := range seats {
		if s.State != Held || s.HoldID != holdID {
			return false
		}
	}
	for _, s := range seats {
		s.book() // [5] Held -> Booked
	}
	return true
}

// Release turns Held into Available, only for seats that this hold still owns.
func (sh *Show) Release(ids []int, holdID int) {
	for _, s := range sh.pick(ids) {
		if s.State == Held && s.HoldID == holdID {
			s.free() // [6] give the seat back
		}
	}
}

// Cancel turns Booked into Available.
func (sh *Show) Cancel(ids []int) {
	for _, s := range sh.pick(ids) {
		if s.State == Booked {
			s.free()
		}
	}
}

func (sh *Show) Free() []int {
	free := []int{}
	for _, s := range sh.Seats {
		if s.State == Available {
			free = append(free, s.ID)
		}
	}
	return free
}

type Pricing interface {
	Price(c Category) int
}

type ByCategory struct{ Rates map[Category]int }

func (p ByCategory) Price(c Category) int { return p.Rates[c] }

// PeakSurcharge wraps another rule and adds a percentage, in whole money units.
type PeakSurcharge struct {
	Inner   Pricing
	Percent int
}

func (p PeakSurcharge) Price(c Category) int { return p.Inner.Price(c) * (100 + p.Percent) / 100 }

type Hold struct {
	ID, ShowID int
	User       string
	Seats      []int
	Total      int // the price is quoted at hold time and stays fixed
	Until      int
}

type Booking struct {
	ID, ShowID int
	User       string
	Seats      []int
	Total      int
}

type BookingService struct {
	shows       map[int]*Show
	pricing     Pricing
	holdFor     int
	holds       map[int]Hold
	bookings    map[int]Booking
	nextHold    int
	nextBooking int
}

// NewBookingService [1] owns the shows and is handed its price rule and hold length.
func NewBookingService(shows map[int]*Show, pricing Pricing, holdFor int) *BookingService {
	return &BookingService{shows: shows, pricing: pricing, holdFor: holdFor, holds: map[int]Hold{}, bookings: map[int]Booking{}, nextHold: 1, nextBooking: 1}
}

// Hold returns the hold id, or -1 if the show is unknown or any seat is missing or taken.
func (b *BookingService) Hold(showID int, user string, seatIDs []int, now int) int {
	show := b.shows[showID]
	if show == nil {
		return -1
	}
	show.Sweep(now)
	until := now + b.holdFor
	seats := show.Hold(seatIDs, b.nextHold, until)
	if seats == nil {
		return -1
	}
	total := 0
	for _, s := range seats {
		total += b.pricing.Price(s.Category) // [4] ask the strategy, per seat category
	}
	h := Hold{ID: b.nextHold, ShowID: showID, User: user, Seats: seatIDs, Total: total, Until: until}
	b.nextHold++
	b.holds[h.ID] = h
	return h.ID
}

// Confirm turns a live hold into a booking. It fails if the hold is not yours, not found, or has lapsed.
func (b *BookingService) Confirm(holdID int, user string, now int) (Booking, bool) {
	h, ok := b.holds[holdID]
	if !ok || h.User != user {
		return Booking{}, false
	}
	show := b.shows[h.ShowID]
	show.Sweep(now)
	delete(b.holds, holdID) // used up or dead, either way it cannot be tried again
	if !show.Book(h.Seats, h.ID) {
		return Booking{}, false
	}
	bk := Booking{ID: b.nextBooking, ShowID: h.ShowID, User: user, Seats: h.Seats, Total: h.Total}
	b.nextBooking++
	b.bookings[bk.ID] = bk
	return bk, true
}

// Release gives up your own hold. It reports false if there is no such hold of yours.
func (b *BookingService) Release(holdID int, user string) bool {
	h, ok := b.holds[holdID]
	if !ok || h.User != user {
		return false
	}
	b.shows[h.ShowID].Release(h.Seats, h.ID)
	delete(b.holds, holdID)
	return true
}

// Cancel frees a booking's seats and returns the refund. It returns -1 if the booking is not yours.
func (b *BookingService) Cancel(bookingID int, user string) int {
	bk, ok := b.bookings[bookingID]
	if !ok || bk.User != user {
		return -1
	}
	b.shows[bk.ShowID].Cancel(bk.Seats)
	delete(b.bookings, bookingID)
	return bk.Total
}

func (b *BookingService) Available(showID, now int) []int {
	show := b.shows[showID]
	if show == nil {
		return []int{}
	}
	show.Sweep(now)
	return show.Free()
}

func (b *BookingService) StateOf(showID, seatID, now int) SeatState {
	show := b.shows[showID]
	if show == nil || seatID < 1 || seatID > len(show.Seats) {
		return "none"
	}
	show.Sweep(now)
	return show.Seats[seatID-1].State
}
