package lld_chess

import "strings"

// runOps replays operations the same way the TypeScript driver does.
// Game arg: piece placement in FEN, then a space and the side to move (w or b), or "start".
func runOps(ops []string, args [][]any) []any {
	var g *Game
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Game":
			text := a[0].(string)
			if text == "start" {
				text = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w"
			}
			placement, side, _ := strings.Cut(text, " ")
			turn := Color('w')
			if side == "b" {
				turn = 'b'
			}
			g = NewGame(BoardFromFen(placement), turn)
			out = append(out, nil)
		case "move":
			out = append(out, g.Move(a[0].(string)))
		case "board":
			out = append(out, g.Board.Fen())
		case "count":
			out = append(out, len(g.Legal(g.Turn, "")))
		case "moves":
			out = append(out, g.Legal(g.Turn, a[0].(string)))
		}
	}
	return out
}
