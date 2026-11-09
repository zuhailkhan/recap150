package lld_snake_and_ladder

import "strconv"

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
// Game args: board size, jumps as [head, tail] pairs, number of players, the scripted rolls.
func runOps(ops []string, args [][]any) []any {
	var g *Game
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Game":
			jumps := map[int]int{}
			for _, j := range a[1].([]any) {
				p := j.([]any)
				jumps[int(p[0].(float64))] = int(p[1].(float64))
			}
			var players []*Player
			for n := 1; n <= int(a[2].(float64)); n++ {
				players = append(players, &Player{Name: "P" + strconv.Itoa(n)})
			}
			var rolls []int
			for _, r := range a[3].([]any) {
				rolls = append(rolls, int(r.(float64)))
			}
			g = NewGame(Board{Size: int(a[0].(float64)), Jumps: jumps}, players, &ScriptedDice{Rolls: rolls})
			out = append(out, nil)
		case "play":
			if pos, ok, _ := g.Play(); ok {
				out = append(out, pos)
			} else {
				out = append(out, -1)
			}
		case "positions":
			pos := []int{}
			for _, p := range g.Players {
				pos = append(pos, p.Pos)
			}
			out = append(out, pos)
		case "winner":
			w := -1
			for n, p := range g.Players {
				if p == g.Winner {
					w = n
				}
			}
			out = append(out, w)
		}
	}
	return out
}
