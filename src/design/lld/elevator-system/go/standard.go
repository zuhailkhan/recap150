package lld_elevator_system

import (
	"fmt"
	"slices"
)

// Floors are integers from 0 (ground). Time is whole ticks: every Tick moves each elevator one floor
// or takes one door step. Nothing here reads a clock or uses randomness, so a run always replays the same way.
type State int

const (
	Idle State = iota
	MovingUp
	MovingDown
	DoorsOpen
)

// Call is the button pressed in the hall: the direction the rider wants to go.
type Call int

const (
	CallUp Call = iota
	CallDown
)

type Elevator struct {
	ID    int
	Floor int
	State State
	Dir   int          // the way it is travelling: -1, 0 (none) or 1
	Car   map[int]bool // floors pressed inside the car
	Up    map[int]bool // hall calls from riders who want to go up
	Down  map[int]bool // hall calls from riders who want to go down
}

func NewElevator(id, floor int) *Elevator {
	return &Elevator{ID: id, Floor: floor, Car: map[int]bool{}, Up: map[int]bool{}, Down: map[int]bool{}}
}

// AddCar and AddHall remember a stop: a car button inside, or a hall call with a direction.
func (e *Elevator) AddCar(floor int) { e.Car[floor] = true } // [3] remember the stop
func (e *Elevator) AddHall(floor int, c Call) {
	if c == CallUp {
		e.Up[floor] = true
	} else {
		e.Down[floor] = true
	}
}

// Pending lists every floor with a call or a car button, lowest first.
func (e *Elevator) Pending() []int {
	seen := map[int]bool{}
	var p []int
	for _, set := range []map[int]bool{e.Car, e.Up, e.Down} {
		for f := range set {
			if !seen[f] {
				seen[f] = true
				p = append(p, f)
			}
		}
	}
	slices.Sort(p)
	return p
}

// Step is one tick. It reports whether the doors opened on this tick.
func (e *Elevator) Step() bool {
	switch e.State {
	case Idle:
		p := e.Pending()
		if len(p) == 0 {
			return false
		}
		if slices.Contains(p, e.Floor) { // someone is calling right here
			return e.open(true)
		}
		e.Dir = e.pickDir()
		e.State = MovingDown
		if e.Dir > 0 {
			e.State = MovingUp
		}
		return e.move()
	case MovingUp, MovingDown:
		return e.move()
	default: // DoorsOpen
		e.Dir = e.pickDir() // [6] doors close: keep the direction if work is ahead, else turn round, else idle
		switch {
		case e.Dir > 0:
			e.State = MovingUp
		case e.Dir < 0:
			e.State = MovingDown
		default:
			e.State = Idle
		}
		return false
	}
}

func (e *Elevator) move() bool {
	e.Floor += e.Dir
	f := e.Floor
	hall := e.Down
	if e.Dir > 0 {
		hall = e.Up
	}
	wanted := e.Car[f] || hall[f]
	last := slices.Contains(e.Pending(), f)
	for _, p := range e.Pending() {
		if (p-f)*e.Dir > 0 {
			last = false
		}
	}
	if !wanted && !last { // [5] pass floors where nobody is waiting to go our way
		return false
	}
	return e.open(last) // at the last stop in this direction, answer every call here
}

func (e *Elevator) open(all bool) bool {
	f := e.Floor
	delete(e.Car, f)
	if all || e.Dir > 0 {
		delete(e.Up, f)
	}
	if all || e.Dir < 0 {
		delete(e.Down, f)
	}
	e.State = DoorsOpen
	return true
}

// pickDir keeps going the way we were going while there is work ahead. Otherwise it turns round, or stops.
func (e *Elevator) pickDir() int {
	var above, below []int
	for _, f := range e.Pending() {
		if f > e.Floor {
			above = append(above, f)
		} else if f < e.Floor {
			below = append(below, f)
		}
	}
	switch {
	case len(above) > 0 && len(below) > 0:
		if e.Dir != 0 {
			return e.Dir
		}
		if above[0]-e.Floor <= e.Floor-below[len(below)-1] { // no direction yet: nearest side, a tie goes up
			return 1
		}
		return -1
	case len(above) > 0:
		return 1
	case len(below) > 0:
		return -1
	}
	return 0
}

// Scheduler chooses which elevator answers a hall call. It only reads the elevators.
type Scheduler interface {
	Pick(elevators []*Elevator, floor int, call Call) int
}

// NearestIdle sends the nearest idle elevator. If none is idle, the nearest of all. Ties go to the lowest id.
type NearestIdle struct{}

func (NearestIdle) Pick(elevators []*Elevator, floor int, _ Call) int {
	var pool []*Elevator
	for _, e := range elevators {
		if e.State == Idle {
			pool = append(pool, e)
		}
	}
	if len(pool) == 0 {
		pool = elevators
	}
	best := pool[0]
	for _, e := range pool {
		if abs(e.Floor-floor) < abs(best.Floor-floor) {
			best = e
		}
	}
	return best.ID
}

// DirectionAware estimates the ticks each elevator needs, honouring its direction, and takes the cheapest.
// Ties go to the lowest id.
type DirectionAware struct{}

func (d DirectionAware) Pick(elevators []*Elevator, floor int, call Call) int {
	best := elevators[0]
	for _, e := range elevators {
		if d.cost(e, floor, call) < d.cost(best, floor, call) {
			best = e
		}
	}
	return best.ID
}

func (DirectionAware) cost(e *Elevator, floor int, call Call) int {
	pending := e.Pending()
	queued := 2 * len(pending) // each stop costs about two ticks of door time
	if e.Dir == 0 {
		return abs(e.Floor-floor) + queued
	}
	sameWay := (call == CallUp) == (e.Dir > 0)
	if sameWay && (floor-e.Floor)*e.Dir > 0 { // on its way, going our way
		return abs(floor-e.Floor) + queued
	}
	turn := e.Floor // it must finish its sweep first
	for _, p := range pending {
		if (p-turn)*e.Dir > 0 {
			turn = p
		}
	}
	return abs(turn-e.Floor) + abs(turn-floor) + queued
}

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

type Building struct {
	TickNo    int
	Log       []string // "t<tick>:e<id>@<floor>" each time a door opens
	Floors    int      // [1] the building owns its elevators and is handed the scheduling rule
	Elevators []*Elevator
	scheduler Scheduler
}

func NewBuilding(floors int, elevators []*Elevator, s Scheduler) *Building {
	return &Building{Floors: floors, Elevators: elevators, scheduler: s}
}

// Hall returns the elevator that will answer, or -1 for a floor that does not exist or a button the floor does not have.
func (b *Building) Hall(floor int, call Call) int {
	if floor < 0 || floor >= b.Floors || (call == CallUp && floor == b.Floors-1) || (call == CallDown && floor == 0) {
		return -1
	}
	id := b.scheduler.Pick(b.Elevators, floor, call) // [2] ask the scheduler, never choose here
	b.Elevators[id].AddHall(floor, call)
	return id
}

// Press is a rider inside elevator id pressing a floor button. False for an unknown elevator or floor.
func (b *Building) Press(id, floor int) bool {
	if id < 0 || id >= len(b.Elevators) || floor < 0 || floor >= b.Floors {
		return false
	}
	b.Elevators[id].AddCar(floor)
	return true
}

func (b *Building) Tick() {
	b.TickNo++
	for _, e := range b.Elevators {
		if e.Step() { // [4] every elevator takes one step, in id order
			b.Log = append(b.Log, fmt.Sprintf("t%d:e%d@%d", b.TickNo, e.ID, e.Floor))
		}
	}
}
