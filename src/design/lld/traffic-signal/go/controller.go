package lld_traffic_signal

import "strings"

// Time is whole ticks. The clock lives outside: whoever owns it calls Junction.Tick once per tick.
type Color string

const (
	Green  Color = "green"
	Yellow Color = "yellow"
	Red    Color = "red"
)

var next = map[Color]Color{Green: Yellow, Yellow: Red, Red: Green}

// Signal is one head for a pair of opposing directions (north and south show the same colour).
type Signal struct {
	Name          string
	Color         Color
	Left          int // ticks until the next colour (not used while red)
	green, yellow int
}

func NewSignal(name string, green, yellow int) *Signal {
	return &Signal{Name: name, Color: Red, green: green, yellow: yellow}
}

func (s *Signal) Go() {
	s.Color = Green
	s.Left = s.green
}

// Tick returns true when the signal has just turned red. Red never counts: the junction decides when it ends.
func (s *Signal) Tick() bool {
	if s.Color == Red {
		return false
	}
	if s.Left--; s.Left > 0 { // [3] still counting down in this colour
		return false
	}
	s.Color = next[s.Color]
	s.Left = 0
	if s.Color == Yellow {
		s.Left = s.yellow
	}
	return s.Color == Red
}

// Crossing is the pedestrian button and the walk phase.
type Crossing struct {
	Waiting bool // someone has asked
	Left    int  // ticks of walk remaining
	walk    int
}

func NewCrossing(walk int) *Crossing { return &Crossing{walk: walk} }

func (c *Crossing) Walking() bool { return c.Left > 0 }

// Press returns true if this press queued a new request. A second press, or one during the walk, adds nothing.
func (c *Crossing) Press() bool {
	if c.Waiting || c.Walking() || c.walk < 1 { // [5] the button only records a request
		return false
	}
	c.Waiting = true
	return true
}

// Open is called at the safe moment. It starts the walk if someone asked.
func (c *Crossing) Open() bool {
	if !c.Waiting {
		return false
	}
	c.Waiting = false
	c.Left = c.walk
	return true
}

// Tick is one tick of the walk. It returns true when the walk has just ended.
func (c *Crossing) Tick() bool {
	if !c.Walking() {
		return false
	}
	c.Left--
	return c.Left == 0
}

// Junction owns the order of play. Only one axis is ever lit, so two opposing greens are impossible by construction.
type Junction struct {
	signals  []*Signal
	crossing *Crossing
	active   int
}

func NewJunction(signals []*Signal, crossing *Crossing) *Junction {
	j := &Junction{signals: signals, crossing: crossing}
	j.signals[0].Go() // [1] the first axis starts green, every other one is red
	return j
}

func (j *Junction) Press() bool { return j.crossing.Press() }

func (j *Junction) Tick() {
	// [2] one tick of the clock: exactly one thing moves, the walk or the active signal
	if j.crossing.Walking() {
		if j.crossing.Tick() {
			j.signals[j.active].Go() // walk over: the next axis starts
		}
		return
	}
	if !j.signals[j.active].Tick() {
		return
	}
	j.active = (j.active + 1) % len(j.signals) // [4] the active axis is red: the safe moment to hand over
	if !j.crossing.Open() {
		j.signals[j.active].Go() // a waiting pedestrian goes first, otherwise the next axis
	}
}

// Safe is the invariant: at most one axis is lit, and nothing is lit during the walk.
func (j *Junction) Safe() bool {
	lit := 0
	for _, s := range j.signals {
		if s.Color != Red {
			lit++
		}
	}
	return lit <= 1 && !(lit == 1 && j.crossing.Walking())
}

// Look gives for example "NS:G EW:R", with " WALK" during the walk and " req" while a request waits.
func (j *Junction) Look() string {
	parts := make([]string, len(j.signals))
	for i, s := range j.signals {
		parts[i] = s.Name + ":" + strings.ToUpper(string(s.Color[0]))
	}
	out := strings.Join(parts, " ")
	if j.crossing.Walking() {
		out += " WALK"
	}
	if j.crossing.Waiting {
		out += " req"
	}
	return out
}
