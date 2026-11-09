package lld_chess

import (
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode"
)

type Color byte // 'w' or 'b'
type Kind byte  // 'P' 'N' 'B' 'R' 'Q' 'K'

// Sq: R is the rank (0 = rank 1, 7 = rank 8) and C the file (0 = a, 7 = h).
type Sq struct{ R, C int }
type Dirs [][2]int

// MoveRule is how one kind of piece moves. It answers geometry, a clear path, and "not onto your own piece".
// It knows nothing about check.
type MoveRule interface {
	Reaches(b *Board, from, to Sq) bool
}

// Slide is bishop, rook and queen: go along a direction until something is in the way.
type Slide struct{ Dirs Dirs }

func (s Slide) Reaches(b *Board, from, to Sq) bool {
	me := b.At(from)
	for _, d := range s.Dirs {
		for p := (Sq{from.R + d[0], from.C + d[1]}); b.Inside(p); p = (Sq{p.R + d[0], p.C + d[1]}) {
			other := b.At(p)
			if p == to {
				return other == nil || other.Color != me.Color
			}
			if other != nil {
				break // something blocks the path
			}
		}
	}
	return false
}

// Jump is knight and king: land on one of a fixed set of offsets. Nothing is in between, so nothing can block.
type Jump struct{ Offsets Dirs }

func (j Jump) Reaches(b *Board, from, to Sq) bool {
	other, me := b.At(to), b.At(from)
	for _, d := range j.Offsets {
		if from.R+d[0] == to.R && from.C+d[1] == to.C {
			return other == nil || other.Color != me.Color
		}
	}
	return false
}

// PawnRule: forward one (or two from home) onto an empty square. Diagonal one only to capture.
type PawnRule struct{}

func (PawnRule) Reaches(b *Board, from, to Sq) bool {
	me := b.At(from)
	dir, home := 1, 1
	if me.Color == 'b' {
		dir, home = -1, 6
	}
	dr, dc := to.R-from.R, abs(to.C-from.C)
	other := b.At(to)
	if dc == 0 && other == nil {
		return dr == dir || (dr == 2*dir && from.R == home && b.At(Sq{from.R + dir, from.C}) == nil)
	}
	return dc == 1 && dr == dir && other != nil && other.Color != me.Color
}

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

var (
	ortho = Dirs{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	diag  = Dirs{{1, 1}, {1, -1}, {-1, 1}, {-1, -1}}
	// The rules hold no state, so every piece of a kind shares one.
	rules = map[Kind]MoveRule{
		'P': PawnRule{},
		'N': Jump{Dirs{{2, 1}, {2, -1}, {-2, 1}, {-2, -1}, {1, 2}, {1, -2}, {-1, 2}, {-1, -2}}},
		'B': Slide{diag},
		'R': Slide{ortho},
		'Q': Slide{append(append(Dirs{}, ortho...), diag...)},
		'K': Jump{append(append(Dirs{}, ortho...), diag...)},
	}
)

type Piece struct {
	Color Color
	Kind  Kind
	Rule  MoveRule // each piece carries its own movement rule
}

func NewPiece(c Color, k Kind) *Piece { return &Piece{Color: c, Kind: k, Rule: rules[k]} }

func (p *Piece) Letter() byte {
	if p.Color == 'w' {
		return byte(p.Kind)
	}
	return byte(unicode.ToLower(rune(p.Kind)))
}

type Board struct{ cells [8][8]*Piece }

// BoardFromFen reads the piece-placement part of FEN: rank 8 first, capitals are white, digits are empty squares.
func BoardFromFen(fen string) *Board {
	b := &Board{}
	for i, row := range strings.Split(fen, "/") {
		c := 0
		for _, ch := range row {
			if ch >= '1' && ch <= '8' {
				c += int(ch - '0')
			} else {
				color := Color('b')
				if unicode.IsUpper(ch) {
					color = 'w'
				}
				b.cells[7-i][c] = NewPiece(color, Kind(unicode.ToUpper(ch)))
				c++
			}
		}
	}
	return b
}

func (b *Board) Fen() string {
	var rows []string
	for r := 7; r >= 0; r-- {
		var sb strings.Builder
		empty := 0
		for c := 0; c < 8; c++ {
			if p := b.cells[r][c]; p == nil {
				empty++
			} else {
				if empty > 0 {
					sb.WriteString(strconv.Itoa(empty))
					empty = 0
				}
				sb.WriteByte(p.Letter())
			}
		}
		if empty > 0 {
			sb.WriteString(strconv.Itoa(empty))
		}
		rows = append(rows, sb.String())
	}
	return strings.Join(rows, "/")
}

func (b *Board) Inside(s Sq) bool { return s.R >= 0 && s.R < 8 && s.C >= 0 && s.C < 8 }

func (b *Board) At(s Sq) *Piece {
	if !b.Inside(s) {
		return nil
	}
	return b.cells[s.R][s.C]
}

// Move moves without any checking and returns what was captured, so the move can be undone.
func (b *Board) Move(from, to Sq) *Piece {
	taken := b.cells[to.R][to.C]
	b.cells[to.R][to.C] = b.cells[from.R][from.C]
	b.cells[from.R][from.C] = nil
	return taken
}

func (b *Board) Undo(from, to Sq, taken *Piece) {
	b.cells[from.R][from.C] = b.cells[to.R][to.C]
	b.cells[to.R][to.C] = taken
}

type Placed struct {
	At Sq
	P  *Piece
}

// Pieces lists one side's pieces in a fixed order: rank 1 up, file a to h.
func (b *Board) Pieces(color Color) []Placed {
	var out []Placed
	for r := 0; r < 8; r++ {
		for c := 0; c < 8; c++ {
			if p := b.cells[r][c]; p != nil && p.Color == color {
				out = append(out, Placed{Sq{r, c}, p})
			}
		}
	}
	return out
}

func name(s Sq) string { return string("abcdefgh"[s.C]) + strconv.Itoa(s.R+1) }

var moveText = regexp.MustCompile(`^([a-h])([1-8])([a-h])([1-8])$`)

type Game struct {
	Board *Board // [1] the game owns the board and whose turn it is
	Turn  Color
	Over  bool
}

func NewGame(b *Board, turn Color) *Game { return &Game{Board: b, Turn: turn} }

// Move returns "ok", "check", "checkmate" or "stalemate" for a move that was played, or "rejected: why".
func (g *Game) Move(text string) string {
	if g.Over {
		return "rejected: game over"
	}
	m := moveText.FindStringSubmatch(text)
	if m == nil {
		return "rejected: bad input"
	}
	from := Sq{int(m[2][0] - '1'), int(m[1][0] - 'a')}
	to := Sq{int(m[4][0] - '1'), int(m[3][0] - 'a')}
	piece := g.Board.At(from)
	if piece == nil {
		return "rejected: no piece"
	}
	if piece.Color != g.Turn { // [2] it must be a piece of the side to move
		return "rejected: not your turn"
	}
	if !piece.Rule.Reaches(g.Board, from, to) { // [3] ask the piece's own rule: shape, clear path, not onto your own
		return "rejected: illegal move"
	}
	if g.exposesKing(from, to) { // [4] try the move, look for an attacker on your king, undo
		return "rejected: king in check"
	}
	g.Board.Move(from, to) // [5] play it, pass the turn, and see whether the other side is in check or has no move
	g.Turn = other(g.Turn)
	check := g.InCheck(g.Turn)
	if len(g.Legal(g.Turn, "")) == 0 {
		g.Over = true
		if check {
			return "checkmate"
		}
		return "stalemate"
	}
	if check {
		return "check"
	}
	return "ok"
}

// Legal lists every fully legal move for a side as "e2e4" text, sorted. Pass a square to see only that piece.
func (g *Game) Legal(color Color, only string) []string {
	out := []string{}
	for _, pl := range g.Board.Pieces(color) {
		if only != "" && name(pl.At) != only {
			continue
		}
		for r := 0; r < 8; r++ {
			for c := 0; c < 8; c++ {
				to := Sq{r, c}
				if pl.P.Rule.Reaches(g.Board, pl.At, to) && !g.exposesKing(pl.At, to) {
					out = append(out, name(pl.At)+name(to))
				}
			}
		}
	}
	sort.Strings(out)
	return out
}

func (g *Game) InCheck(color Color) bool {
	var king *Sq
	for _, pl := range g.Board.Pieces(color) {
		if pl.P.Kind == 'K' {
			at := pl.At
			king = &at
			break
		}
	}
	if king == nil {
		return false
	}
	for _, pl := range g.Board.Pieces(other(color)) {
		if pl.P.Rule.Reaches(g.Board, pl.At, *king) {
			return true
		}
	}
	return false
}

func (g *Game) exposesKing(from, to Sq) bool {
	mine := g.Board.At(from).Color
	taken := g.Board.Move(from, to)
	bad := g.InCheck(mine)
	g.Board.Undo(from, to, taken)
	return bad
}

func other(c Color) Color {
	if c == 'w' {
		return 'b'
	}
	return 'w'
}
