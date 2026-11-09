package lld_tic_tac_toe

import "fmt"

type Mark byte

const (
	None Mark = 0
	X    Mark = 'X'
	O    Mark = 'O'
)

type Outcome string

const (
	OK    Outcome = "ok"
	Win   Outcome = "win"
	Draw  Outcome = "draw"
	Out   Outcome = "out"
	Taken Outcome = "taken"
	Over  Outcome = "over"
)

type Move struct {
	R, C int
	Mark Mark
}

// Board holds the cells. It knows what is where and nothing about the rules.
type Board struct {
	N     int
	Cells [][]Mark
}

func NewBoard(n int) *Board {
	cells := make([][]Mark, n)
	for i := range cells {
		cells[i] = make([]Mark, n)
	}
	return &Board{N: n, Cells: cells}
}

func (b *Board) Has(r, c int) bool { return r >= 0 && r < b.N && c >= 0 && c < b.N }

func (b *Board) At(r, c int) Mark { return b.Cells[r][c] }

func (b *Board) Set(r, c int, m Mark) { b.Cells[r][c] = m }

// Tally keeps one counter per row, column and diagonal. X adds 1 and O subtracts 1, so a line is
// complete when its counter reaches +n or -n. A move touches at most four counters, so this is O(1).
type Tally struct {
	n          int
	rows, cols []int
	diag, anti int
}

func NewTally(n int) *Tally { return &Tally{n: n, rows: make([]int, n), cols: make([]int, n)} }

// Add records a mark. It returns true if the mark completes a line.
func (t *Tally) Add(r, c int, m Mark) bool {
	t.bump(r, c, sign(m)) // [3] touch only the counters this cell belongs to
	for _, v := range []int{t.rows[r], t.cols[c], t.diag, t.anti} {
		if v == t.n || v == -t.n { // [4] a line is complete when a counter reaches n
			return true
		}
	}
	return false
}

// Remove takes a mark back out, for undo.
func (t *Tally) Remove(r, c int, m Mark) { t.bump(r, c, -sign(m)) }

func (t *Tally) bump(r, c, d int) {
	t.rows[r] += d
	t.cols[c] += d
	if r == c {
		t.diag += d
	}
	if r+c == t.n-1 {
		t.anti += d
	}
}

func sign(m Mark) int {
	if m == X {
		return 1
	}
	return -1
}

// Game handles turn order, move validation and the end of the game. X always starts.
type Game struct {
	n       int
	Board   *Board
	Tally   *Tally
	History []Move
	Turn    Mark
	Winner  Mark
}

func NewGame(n int) *Game {
	return &Game{n: n, Board: NewBoard(n), Tally: NewTally(n), Turn: X} // [1] an n by n board and its counters, both empty
}

func (g *Game) Play(r, c int) Outcome {
	if g.Winner != None || len(g.History) == g.n*g.n { // [2] check before changing anything
		return Over
	}
	if !g.Board.Has(r, c) {
		return Out
	}
	if g.Board.At(r, c) != None {
		return Taken
	}
	m := g.Turn
	g.Board.Set(r, c, m)
	g.History = append(g.History, Move{r, c, m})
	if g.Tally.Add(r, c, m) {
		g.Winner = m
		return Win
	}
	if len(g.History) == g.n*g.n { // [5] full board and no line: a draw
		return Draw
	}
	if m == X {
		g.Turn = O
	} else {
		g.Turn = X
	}
	return OK
}

// Undo takes back the last move. It returns false if there is none. It works after a win too.
func (g *Game) Undo() bool {
	k := len(g.History)
	if k == 0 {
		return false
	}
	m := g.History[k-1] // [6] the history is a stack: the last move comes off first
	g.History = g.History[:k-1]
	g.Board.Set(m.R, m.C, None)
	g.Tally.Remove(m.R, m.C, m.Mark)
	g.Winner = None
	g.Turn = m.Mark
	return true
}

func (g *Game) Status() string {
	if g.Winner != None {
		return fmt.Sprintf("%c wins", g.Winner)
	}
	if len(g.History) == g.n*g.n {
		return "draw"
	}
	return fmt.Sprintf("%c to move", g.Turn)
}
