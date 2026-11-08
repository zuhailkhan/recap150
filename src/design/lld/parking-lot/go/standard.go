package lld_parking_lot

// Sizes: 1 = motorcycle, 2 = car, 3 = truck. A vehicle fits any spot at least as big as itself.
type Size int

type Vehicle struct {
	Plate string
	Size  Size
}

type Spot struct {
	ID    int
	Size  Size
	Taken bool
}

type Ticket struct {
	ID        int
	SpotID    int
	Vehicle   Vehicle
	EnteredAt int
}

type SpotStrategy interface {
	Pick(spots []*Spot, v Vehicle) *Spot
}

// NearestFree takes the first free spot that fits. Simple, but a motorcycle can waste a truck spot.
type NearestFree struct{}

func (NearestFree) Pick(spots []*Spot, v Vehicle) *Spot {
	for _, s := range spots {
		if !s.Taken && s.Size >= v.Size {
			return s
		}
	}
	return nil
}

// TightestFit takes the smallest free spot that fits, so big spots stay free for big vehicles.
type TightestFit struct{}

func (TightestFit) Pick(spots []*Spot, v Vehicle) *Spot {
	var best *Spot
	for _, s := range spots {
		if s.Taken || s.Size < v.Size {
			continue
		}
		if best == nil || s.Size < best.Size {
			best = s
		}
	}
	return best
}

type Pricing interface {
	Fee(t Ticket, now int) int
}

// HourlyBySize rounds minutes up to whole hours, with a one-hour minimum.
type HourlyBySize struct{ Rates map[Size]int }

func (p HourlyBySize) Fee(t Ticket, now int) int {
	hours := max(1, (now-t.EnteredAt+59)/60)
	return hours * p.Rates[t.Vehicle.Size]
}

type ParkingLot struct {
	spots    []*Spot // [1] the lot owns the spots and is handed its two rules
	tickets  map[int]Ticket
	nextID   int
	strategy SpotStrategy
	pricing  Pricing
}

func NewParkingLot(spots []*Spot, strategy SpotStrategy, pricing Pricing) *ParkingLot {
	return &ParkingLot{spots: spots, tickets: map[int]Ticket{}, nextID: 1, strategy: strategy, pricing: pricing}
}

func (l *ParkingLot) Park(v Vehicle, now int) (Ticket, bool) {
	spot := l.strategy.Pick(l.spots, v) // [2] ask the strategy, never choose here
	if spot == nil {
		return Ticket{}, false
	}
	spot.Taken = true // [3] mark the spot taken and issue a ticket
	t := Ticket{ID: l.nextID, SpotID: spot.ID, Vehicle: v, EnteredAt: now}
	l.nextID++
	l.tickets[t.ID] = t
	return t, true
}

func (l *ParkingLot) Unpark(id, now int) (int, bool) {
	t, ok := l.tickets[id]
	if !ok {
		return 0, false
	}
	fee := l.pricing.Fee(t, now) // [4] price it, free the spot, retire the ticket
	l.spots[t.SpotID].Taken = false
	delete(l.tickets, id)
	return fee, true
}
