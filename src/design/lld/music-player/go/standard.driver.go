package lld_music_player

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var p *Player
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "MusicPlayer":
			var titles []string
			for _, t := range a[0].([]any) {
				titles = append(titles, t.(string))
			}
			lists := map[string][]int{}
			for name, v := range a[1].(map[string]any) {
				lists[name] = ints(v)
			}
			p = NewPlayer(NewLibrary(titles, lists), SeededShuffle(uint32(a[2].(float64))))
			out = append(out, nil)
		case "load":
			out = append(out, p.Load(a[0].(string)))
		case "enqueue":
			out = append(out, p.Enqueue(int(a[0].(float64))))
		case "play":
			out = append(out, p.Play())
		case "pause":
			out = append(out, p.Pause())
		case "stop":
			out = append(out, p.Stop())
		case "next":
			out = append(out, p.Next())
		case "prev":
			out = append(out, p.Prev())
		case "ended":
			out = append(out, p.Ended())
		case "repeat":
			p.SetRepeat(a[0].(string))
			out = append(out, nil)
		case "shuffle":
			p.SetShuffle(a[0].(float64) == 1)
			out = append(out, nil)
		case "state":
			out = append(out, p.State.Name())
		case "current":
			out = append(out, p.Current())
		case "queue":
			out = append(out, p.Queue.PlayOrder())
		}
	}
	return out
}

func ints(v any) []int {
	out := []int{}
	for _, x := range v.([]any) {
		out = append(out, int(x.(float64)))
	}
	return out
}
