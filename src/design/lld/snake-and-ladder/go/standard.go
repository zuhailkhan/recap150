package lld_snake_and_ladder

import "errors"

// Dice is where rolls come from. Tests hand in a script, a real game hands in a random one.
type Dice interface {
	Roll() (int, error)
}

// ScriptedDice returns the given rolls one by one and fails when they run out.
type ScriptedDice struct {
	Rolls []int
	next  int
}

func (d *ScriptedDice) Roll() (int, error) {
	if d.next >= len(d.Rolls) {
		return 0, errors.New("the scripted dice ran out of rolls")
	}
	d.next++
	return d.Rolls[d.next-1], nil
}

// Board has squares 1..Size. Every snake and ladder is one entry: head square -> tail square.
type Board struct {
	Size  int
	Jumps map[int]int
}

// Settle jumps at most once: the tail is final, even if it is the head of another jump.
// The last square never jumps.
func (b Board) Settle(square int) int {
	if tail, ok := b.Jumps[square]; ok && square != b.Size {
		return tail
	}
	return square
}

type Player struct {
	Name string
	Pos  int // 0 means "not on the board yet"
}

type Game struct {
	Board   Board // [1] the game owns the board and the players, and is handed its dice
	Players []*Player
	Winner  *Player
	dice    Dice
	turn    int
}

func NewGame(b Board, players []*Player, d Dice) *Game {
	return &Game{Board: b, Players: players, dice: d}
}

// Play gives one turn to the player whose turn it is and returns where they stand now.
// ok is false when the game is already over.
func (g *Game) Play() (pos int, ok bool, err error) {
	if g.Winner != nil {
		return 0, false, nil
	}
	p := g.Players[g.turn]
	roll, err := g.dice.Roll() // [2] ask the dice, never roll here
	if err != nil {
		return 0, false, err
	}
	if target := p.Pos + roll; target <= g.Board.Size {
		p.Pos = g.Board.Settle(target) // [3] exact landing only; a roll that overshoots changes nothing
	}
	if p.Pos == g.Board.Size {
		g.Winner = p // [4] reaching the last square wins, otherwise the turn passes on
	} else {
		g.turn = (g.turn + 1) % len(g.Players)
	}
	return p.Pos, true, nil
}
