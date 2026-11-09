package lld_cab_booking

import "slices"

// Distance is whole grid units, money is whole cents. A refused operation returns false, -1 or "none" and changes nothing.
type Point struct{ X, Y int }

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

func Manhattan(a, b Point) int { return abs(a.X-b.X) + abs(a.Y-b.Y) }

type TripState string

// next lists the only legal moves. A move that is not listed here is refused.
var next = map[TripState][]TripState{
	"Requested":  {"Matched", "Cancelled"},
	"Matched":    {"InProgress", "Cancelled"},
	"InProgress": {"Completed"}, // once the ride has started, it cannot be cancelled
}

type Driver struct {
	ID     string
	At     Point
	Online bool
	Busy   bool
}

func (d *Driver) Free() bool { return d.Online && !d.Busy }

type Trip struct {
	ID           int
	Rider        string
	From, To     Point
	SurgePercent int
	State        TripState
	DriverID     string
}

func (t *Trip) Move(to TripState) bool {
	if !slices.Contains(next[t.State], to) { // [3] the table decides, so no caller can skip a step
		return false
	}
	t.State = to
	return true
}

// MatchingStrategy chooses a driver for a pickup point. It returns nil when nobody is free.
type MatchingStrategy interface {
	Pick(drivers []*Driver, from Point) *Driver
}

// NearestDriver picks the closest free driver by Manhattan distance. Ties go to the smaller id, whatever the list order.
type NearestDriver struct{}

func (NearestDriver) Pick(drivers []*Driver, from Point) *Driver {
	var best *Driver
	bestDist := 0
	for _, d := range drivers {
		if !d.Free() {
			continue
		}
		dist := Manhattan(d.At, from)
		if best == nil || dist < bestDist || (dist == bestDist && d.ID < best.ID) {
			best, bestDist = d, dist
		}
	}
	return best
}

// FirstFree ignores distance: the free driver with the smallest id. The naive baseline.
type FirstFree struct{}

func (FirstFree) Pick(drivers []*Driver, _ Point) *Driver {
	var best *Driver
	for _, d := range drivers {
		if d.Free() && (best == nil || d.ID < best.ID) {
			best = d
		}
	}
	return best
}

// FareStrategy prices a trip. surgePercent is 100 for normal pricing, 150 for 1.5 times.
type FareStrategy interface {
	Fare(distance, surgePercent int) int
}

type DistanceFare struct{ Base, PerUnit int }

func (f DistanceFare) Fare(distance, surgePercent int) int {
	return (f.Base + f.PerUnit*distance) * surgePercent / 100 // whole cents, rounded down
}

type CabService struct {
	drivers []*Driver // insertion order
	byID    map[string]*Driver
	trips   []*Trip // trip id n is trips[n-1], so the slice is also request order
	matcher MatchingStrategy
	fares   FareStrategy
}

func NewCabService(m MatchingStrategy, f FareStrategy) *CabService {
	return &CabService{byID: map[string]*Driver{}, matcher: m, fares: f}
}

func (s *CabService) AddDriver(id string, at Point) bool {
	if _, dup := s.byID[id]; dup {
		return false
	}
	d := &Driver{ID: id, At: at, Online: true}
	s.drivers = append(s.drivers, d)
	s.byID[id] = d
	s.dispatch()
	return true
}

// SetAvailable goes online or offline. Refused for an unknown driver, or one who is on a trip.
func (s *CabService) SetAvailable(id string, online bool) bool {
	d := s.byID[id]
	if d == nil || d.Busy {
		return false
	}
	d.Online = online
	if online {
		s.dispatch()
	}
	return true
}

// RequestRide always creates a trip. It stays Requested until a driver is free.
func (s *CabService) RequestRide(rider string, from, to Point, surgePercent int) int {
	t := &Trip{ID: len(s.trips) + 1, Rider: rider, From: from, To: to, SurgePercent: surgePercent, State: "Requested"} // [1] a new trip starts as Requested, with its surge locked in
	s.trips = append(s.trips, t)
	s.dispatch()
	return t.ID
}

func (s *CabService) trip(id int) *Trip {
	if id < 1 || id > len(s.trips) {
		return nil
	}
	return s.trips[id-1]
}

func (s *CabService) StartTrip(id int) bool {
	t := s.trip(id)
	return t != nil && t.Move("InProgress")
}

// EndTrip returns the fare in cents, or -1 if the trip is not in progress.
func (s *CabService) EndTrip(id int) int {
	t := s.trip(id)
	if t == nil || !t.Move("Completed") {
		return -1
	}
	fare := s.fares.Fare(Manhattan(t.From, t.To), t.SurgePercent) // [4] price it by the pluggable formula
	s.release(t.DriverID, t.To)                                   // the driver is now at the drop-off
	return fare
}

func (s *CabService) Cancel(id int) bool {
	t := s.trip(id)
	if t == nil || !t.Move("Cancelled") {
		return false
	}
	if t.DriverID != "" {
		d := s.byID[t.DriverID]
		t.DriverID = ""
		s.release(d.ID, d.At) // the driver never moved
	}
	return true
}

// Status is "Matched:d2", "Requested", or "none" for an unknown trip.
func (s *CabService) Status(id int) string {
	t := s.trip(id)
	if t == nil {
		return "none"
	}
	if t.DriverID != "" {
		return string(t.State) + ":" + t.DriverID
	}
	return string(t.State)
}

func (s *CabService) release(driverID string, at Point) {
	d := s.byID[driverID]
	d.Busy = false // [5] free the driver where the trip ended, then serve anyone waiting
	d.At = at
	s.dispatch()
}

// dispatch matches waiting trips to free drivers, oldest request first.
func (s *CabService) dispatch() {
	for _, t := range s.trips {
		if t.State != "Requested" {
			continue
		}
		d := s.matcher.Pick(s.drivers, t.From) // [2] ask the strategy, never compare distances here
		if d == nil {
			return // nobody is free, and a later trip would not change that
		}
		t.Move("Matched")
		t.DriverID = d.ID
		d.Busy = true
	}
}
