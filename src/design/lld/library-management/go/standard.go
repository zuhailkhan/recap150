package lld_library_management

import "slices"

// Days and money are integers. A failed call returns a negative code and changes nothing.
type FinePolicy interface {
	Fine(daysLate int) int
}

// PerDayFine is a fixed fine for every day late.
type PerDayFine struct{ Rate int }

func (p PerDayFine) Fine(daysLate int) int { return daysLate * p.Rate }

// CappedFine is the same, but never more than a cap, so a forgotten loan cannot cost more than the book.
type CappedFine struct{ Rate, Cap int }

func (p CappedFine) Fine(daysLate int) int { return min(daysLate*p.Rate, p.Cap) }

type Book struct {
	ID   string
	Free int // copies on the shelf that nobody is waiting for
}

type Member struct {
	ID    string
	Loans int // books currently out
}

type Loan struct {
	ID     int
	Member string
	Book   string
	Due    int // the last day it can come back without a fine
	Open   bool
}

// Reservations keeps, per book, a FIFO queue of members waiting and the members whose returned copy is held for them.
type Reservations struct{ queue, ready map[string][]string }

func NewReservations() *Reservations {
	return &Reservations{queue: map[string][]string{}, ready: map[string][]string{}}
}

// Join returns the queue position (1 is next), or -3 if the member already waits or holds a copy.
func (r *Reservations) Join(book, member string) int {
	if slices.Contains(r.queue[book], member) || slices.Contains(r.ready[book], member) {
		return -3
	}
	r.queue[book] = append(r.queue[book], member)
	return len(r.queue[book])
}

// Next moves the head of the queue to "ready" when a copy comes back. False when nobody is waiting.
func (r *Reservations) Next(book string) bool {
	q := r.queue[book]
	if len(q) == 0 {
		return false
	}
	r.ready[book] = append(r.ready[book], q[0])
	r.queue[book] = q[1:]
	return true
}

// Claim uses up a held copy. False when none is held for this member.
func (r *Reservations) Claim(book, member string) bool {
	i := slices.Index(r.ready[book], member)
	if i < 0 {
		return false
	}
	r.ready[book] = slices.Delete(r.ready[book], i, i+1)
	return true
}

func (r *Reservations) Waiting(book string) []string { return slices.Clone(r.queue[book]) }
func (r *Reservations) Held(book string) []string    { return slices.Clone(r.ready[book]) }

type Library struct {
	Books        map[string]*Book // [1] the library owns books and members, and is handed its rules
	Members      map[string]*Member
	loans        map[int]*Loan
	nextID       int
	reservations *Reservations
	policy       FinePolicy
	limit        int
	loanDays     int
}

func NewLibrary(books map[string]*Book, members map[string]*Member, res *Reservations, policy FinePolicy, limit, loanDays int) *Library {
	return &Library{Books: books, Members: members, loans: map[int]*Loan{}, nextID: 1, reservations: res, policy: policy, limit: limit, loanDays: loanDays}
}

// Borrow returns a loan id (1, 2, ...), or -1 unknown member or book, -2 at the limit, -3 no copy for this member.
func (l *Library) Borrow(memberID, bookID string, today int) int {
	m, b := l.Members[memberID], l.Books[bookID]
	if m == nil || b == nil {
		return -1
	}
	if m.Loans >= l.limit { // [2] the limit is checked first, so a held copy is not wasted
		return -2
	}
	held := l.reservations.Claim(bookID, memberID) // [3] a copy held for you comes before the shelf
	if !held && b.Free == 0 {
		return -3
	}
	if !held {
		b.Free--
	}
	m.Loans++
	loan := &Loan{ID: l.nextID, Member: memberID, Book: bookID, Due: today + l.loanDays, Open: true}
	l.nextID++
	l.loans[loan.ID] = loan
	return loan.ID
}

// Reserve returns the queue position, or -1 unknown, -2 a copy is free (just borrow it), -3 already waiting.
func (l *Library) Reserve(memberID, bookID string) int {
	b := l.Books[bookID]
	if l.Members[memberID] == nil || b == nil {
		return -1
	}
	if b.Free > 0 {
		return -2
	}
	return l.reservations.Join(bookID, memberID) // [4] join the back of the queue
}

// ReturnBook returns the fine (0 if on time). False for an unknown or already returned loan.
func (l *Library) ReturnBook(loanID, today int) (int, bool) {
	loan := l.loans[loanID]
	if loan == nil || !loan.Open {
		return 0, false
	}
	loan.Open = false
	l.Members[loan.Member].Loans--
	fine := l.policy.Fine(max(0, today-loan.Due)) // [5] the policy prices the lateness
	if !l.reservations.Next(loan.Book) {          // [6] hold it for the queue head, else shelve it
		l.Books[loan.Book].Free++
	}
	return fine, true
}

func (l *Library) DueOf(loanID int) int {
	if loan := l.loans[loanID]; loan != nil {
		return loan.Due
	}
	return -1
}

func (l *Library) Count(memberID string) int {
	if m := l.Members[memberID]; m != nil {
		return m.Loans
	}
	return -1
}
