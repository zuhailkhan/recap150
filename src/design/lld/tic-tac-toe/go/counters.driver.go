package lld_tic_tac_toe

import "strings"

// show draws the board as rows joined by "/", with "." for an empty cell.
func show(g *Game) string {
	rows := make([]string, g.n)
	for r, row := range g.Board.Cells {
		var sb strings.Builder
		for _, m := range row {
			if m == None {
				sb.WriteByte('.')
			} else {
				sb.WriteByte(byte(m))
			}
		}
		rows[r] = sb.String()
	}
	return strings.Join(rows, "/")
}

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var g *Game
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Game":
			g = NewGame(int(a[0].(float64)))
			out = append(out, nil)
		case "play":
			out = append(out, string(g.Play(int(a[0].(float64)), int(a[1].(float64)))))
		case "undo":
			out = append(out, g.Undo())
		case "status":
			out = append(out, g.Status())
		case "show":
			out = append(out, show(g))
		}
	}
	return out
}
