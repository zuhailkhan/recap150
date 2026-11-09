package lld_music_player

import "slices"

// Songs have ids 1, 2, 3... A playlist is a named list of song ids. Every transport call returns the id of the
// current song after it, or -1 when the call was ignored in the current state.
type Library struct {
	titles []string
	lists  map[string][]int
}

func NewLibrary(titles []string, lists map[string][]int) *Library {
	return &Library{titles: titles, lists: lists}
}

func (l *Library) Has(id int) bool { return id >= 1 && id <= len(l.titles) }

func (l *Library) Title(id int) string { return l.titles[id-1] }

// Playlist returns a copy of the list, or nil if the name is unknown.
func (l *Library) Playlist(name string) []int { return slices.Clone(l.lists[name]) }

// Shuffle reorders a list. It is injected, so tests can use a seeded one and a real app a random one.
type Shuffle func(xs []int) []int

// SeededShuffle is Fisher-Yates driven by a small linear congruential generator.
// The same seed gives the same order in every language.
func SeededShuffle(seed uint32) Shuffle {
	s := seed
	return func(xs []int) []int {
		a := slices.Clone(xs)
		for i := len(a) - 1; i > 0; i-- {
			s = s*1664525 + 1013904223
			j := int(s % uint32(i+1))
			a[i], a[j] = a[j], a[i]
		}
		return a
	}
}

// RepeatMode says where to go from position pos of len songs. -1 means the queue is over.
type RepeatMode interface {
	Next(pos, length int, ended bool) int // ended = the song finished by itself, not skipped
	Prev(pos, length int) int
}

type RepeatOff struct{}

func (RepeatOff) Next(pos, length int, _ bool) int {
	if pos+1 < length {
		return pos + 1
	}
	return -1
}

func (RepeatOff) Prev(pos, _ int) int { return max(pos-1, 0) }

// RepeatOne plays a finished song again. A skip still moves on, and stops after the last song.
type RepeatOne struct{ RepeatOff }

func (r RepeatOne) Next(pos, length int, ended bool) int {
	if ended {
		return pos
	}
	return r.RepeatOff.Next(pos, length, false)
}

type RepeatAll struct{}

func (RepeatAll) Next(pos, length int, _ bool) int { return (pos + 1) % length }

func (RepeatAll) Prev(pos, length int) int { return (pos + length - 1) % length }

// PlayQueue is the iterator over what plays. Callers ask for next and previous, never for an index.
type PlayQueue struct {
	songs    []int // song ids in the order they were added
	order    []int // positions in songs, in play order. Shuffle reorders this, not songs
	pos      int   // where we are in order
	shuffled bool
	shuffle  Shuffle
	Repeat   RepeatMode
}

func NewPlayQueue(shuffle Shuffle, repeat RepeatMode) *PlayQueue {
	return &PlayQueue{shuffle: shuffle, Repeat: repeat}
}

func (q *PlayQueue) Size() int { return len(q.order) }

// Current returns the song at the current position, and false when the queue is empty.
func (q *PlayQueue) Current() (int, bool) {
	if q.pos >= len(q.order) {
		return 0, false
	}
	return q.songs[q.order[q.pos]], true
}

func (q *PlayQueue) PlayOrder() []int {
	ids := make([]int, len(q.order))
	for i, at := range q.order {
		ids[i] = q.songs[at]
	}
	return ids
}

func (q *PlayQueue) Load(ids []int) {
	q.songs = slices.Clone(ids)
	q.order = make([]int, len(ids))
	for i := range ids {
		q.order[i] = i
	}
	q.pos, q.shuffled = 0, false
}

func (q *PlayQueue) Add(id int) {
	q.songs = append(q.songs, id)
	q.order = append(q.order, len(q.songs)-1)
}

// Next moves on and reports false when the queue is over.
func (q *PlayQueue) Next(ended bool) bool {
	to := q.Repeat.Next(q.pos, len(q.order), ended) // [4] the repeat strategy picks the next position
	if to < 0 {
		return false
	}
	q.pos = to
	return true
}

func (q *PlayQueue) Prev() { q.pos = q.Repeat.Prev(q.pos, len(q.order)) }

func (q *PlayQueue) Rewind() { q.pos = 0 }

// SetShuffle: on keeps the song playing now first and reorders the rest. Off goes back to the added order, same song.
func (q *PlayQueue) SetShuffle(on bool) {
	if on == q.shuffled {
		return
	}
	q.shuffled = on
	if len(q.order) == 0 {
		return
	}
	if on {
		rest := slices.Delete(slices.Clone(q.order), q.pos, q.pos+1)
		q.order = append([]int{q.order[q.pos]}, q.shuffle(rest)...) // [5] current song first, the rest in the injected order
		q.pos = 0
		return
	}
	q.pos = q.order[q.pos]
	for i := range q.order {
		q.order[i] = i
	}
}

// PlayerState is every transport action. Each state answers all of them. true = accepted, false = ignored.
type PlayerState interface {
	Name() string
	Play() bool
	Pause() bool
	Stop() bool
	Next() bool
	Prev() bool
	Ended() bool // the current song finished by itself
}

// Player is the context. It owns the queue and forwards every action to the current state.
type Player struct {
	library *Library
	Queue   *PlayQueue
	State   PlayerState
	stopped PlayerState
	playing PlayerState
	paused  PlayerState
	modes   map[string]RepeatMode
}

func NewPlayer(library *Library, shuffle Shuffle) *Player {
	p := &Player{library: library, modes: map[string]RepeatMode{"off": RepeatOff{}, "one": RepeatOne{}, "all": RepeatAll{}}}
	p.stopped, p.playing, p.paused = &stopped{p}, &playing{p}, &paused{p}
	p.Queue = NewPlayQueue(shuffle, p.modes["off"]) // [1] an empty queue, repeat off, and the player starts Stopped
	p.State = p.stopped
	return p
}

// Load replaces the queue with a playlist and stops. It returns the length, or -1 if the playlist is unknown or empty.
func (p *Player) Load(name string) int {
	ids := p.library.Playlist(name)
	if len(ids) == 0 {
		return -1
	}
	p.Queue.Load(ids)
	p.State = p.stopped
	return len(ids)
}

// Enqueue adds one song to the end of the queue. It returns the new length, or -1 for an unknown song.
func (p *Player) Enqueue(id int) int {
	if !p.library.Has(id) {
		return -1
	}
	p.Queue.Add(id)
	return p.Queue.Size()
}

func (p *Player) Play() int  { return p.answer(p.State.Play()) } // [2] no if/else on state here: the current state decides
func (p *Player) Pause() int { return p.answer(p.State.Pause()) }
func (p *Player) Stop() int  { return p.answer(p.State.Stop()) }
func (p *Player) Next() int  { return p.answer(p.State.Next()) }
func (p *Player) Prev() int  { return p.answer(p.State.Prev()) }
func (p *Player) Ended() int { return p.answer(p.State.Ended()) }

func (p *Player) SetRepeat(mode string) { p.Queue.Repeat = p.modes[mode] }
func (p *Player) SetShuffle(on bool)    { p.Queue.SetShuffle(on) }

func (p *Player) Current() int {
	if id, ok := p.Queue.Current(); ok {
		return id
	}
	return -1
}

func (p *Player) setState(s PlayerState) {
	p.State = s // [3] a state moves the player by naming the next state
}

// finish ends playback: go back to the first song and stop.
func (p *Player) finish() {
	p.Queue.Rewind()
	p.setState(p.stopped)
}

func (p *Player) answer(accepted bool) int {
	if !accepted {
		return -1
	}
	return p.Current()
}

type stopped struct{ p *Player }

func (*stopped) Name() string { return "Stopped" }
func (s *stopped) Play() bool {
	if s.p.Queue.Size() == 0 { // nothing to play
		return false
	}
	s.p.setState(s.p.playing)
	return true
}
func (*stopped) Pause() bool { return false }
func (*stopped) Stop() bool  { return false }
func (*stopped) Next() bool  { return false }
func (*stopped) Prev() bool  { return false }
func (*stopped) Ended() bool { return false }

type playing struct{ p *Player }

func (*playing) Name() string { return "Playing" }
func (*playing) Play() bool   { return false }
func (s *playing) Pause() bool {
	s.p.setState(s.p.paused)
	return true
}
func (s *playing) Stop() bool {
	s.p.finish()
	return true
}
func (s *playing) Next() bool { return s.advance(false) }
func (s *playing) Prev() bool {
	s.p.Queue.Prev()
	return true
}
func (s *playing) Ended() bool { return s.advance(true) }
func (s *playing) advance(ended bool) bool {
	if !s.p.Queue.Next(ended) { // past the last song with repeat off
		s.p.finish()
	}
	return true
}

type paused struct{ p *Player }

func (*paused) Name() string { return "Paused" }
func (s *paused) Play() bool {
	s.p.setState(s.p.playing)
	return true
}
func (*paused) Pause() bool { return false }
func (s *paused) Stop() bool {
	s.p.finish()
	return true
}
func (s *paused) Next() bool {
	if s.p.Queue.Next(false) {
		s.p.setState(s.p.playing) // skipping while paused starts the next song
	} else {
		s.p.finish()
	}
	return true
}
func (s *paused) Prev() bool {
	s.p.Queue.Prev()
	s.p.setState(s.p.playing)
	return true
}
func (*paused) Ended() bool { return false } // a paused song cannot finish
