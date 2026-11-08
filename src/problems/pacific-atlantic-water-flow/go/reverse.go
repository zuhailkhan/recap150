package pacific_atlantic_water_flow

var dirs = [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

func pacificAtlantic(h [][]int) [][]int {
	rows := len(h)
	if rows == 0 || len(h[0]) == 0 {
		return [][]int{}
	}
	cols := len(h[0])

	// reach returns every cell whose water can run down to the coast cells in starts.
	// We go backwards: from the ocean inland, only to neighbours that are as high or higher.
	reach := func(starts [][2]int) [][]bool {
		seen := make([][]bool, rows)
		for r := range seen {
			seen[r] = make([]bool, cols)
		}
		for _, s := range starts {
			seen[s[0]][s[1]] = true // [1] coast cells touch the ocean
		}
		frontier := starts
		for len(frontier) > 0 {
			var next [][2]int
			for _, cur := range frontier {
				for _, d := range dirs {
					nr, nc := cur[0]+d[0], cur[1]+d[1]
					if nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc] {
						continue // off the map or already known
					}
					if h[nr][nc] < h[cur[0]][cur[1]] {
						continue // [2] lower than where we stand: its water cannot climb up to us
					}
					seen[nr][nc] = true // [2] this neighbour drains into cur, so it reaches the ocean too
					next = append(next, [2]int{nr, nc})
				}
			}
			frontier = next
		}
		return seen
	}

	var pacificCoast, atlanticCoast [][2]int
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if r == 0 || c == 0 {
				pacificCoast = append(pacificCoast, [2]int{r, c})
			}
			if r == rows-1 || c == cols-1 {
				atlanticCoast = append(atlanticCoast, [2]int{r, c})
			}
		}
	}
	pacific, atlantic := reach(pacificCoast), reach(atlanticCoast)

	both := [][]int{}
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if pacific[r][c] && atlantic[r][c] {
				both = append(both, []int{r, c}) // [3] reaches both oceans
			}
		}
	}
	return both
}
