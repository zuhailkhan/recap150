package rotting_oranges

var dirs = [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

func orangesRotting(oranges [][]int) int {
	g := make([][]int, len(oranges)) // work on a copy so the input stays as it was
	var queue [][2]int               // rotten oranges that may rot a neighbour next minute
	fresh := 0
	for r := range oranges {
		g[r] = append([]int(nil), oranges[r]...)
		for c, v := range g[r] {
			if v == 2 {
				queue = append(queue, [2]int{r, c}) // [1] every rotten orange starts the spread at minute 0
			} else if v == 1 {
				fresh++ // [1] count the fresh ones we must reach
			}
		}
	}

	minutes := 0
	for len(queue) > 0 && fresh > 0 {
		var next [][2]int
		for _, cur := range queue {
			for _, d := range dirs {
				nr, nc := cur[0]+d[0], cur[1]+d[1]
				if nr < 0 || nr >= len(g) || nc < 0 || nc >= len(g[nr]) {
					continue // off the grid
				}
				if g[nr][nc] != 1 {
					continue // empty or already rotten
				}
				g[nr][nc] = 2 // [2] a fresh neighbour rots this minute
				fresh--
				next = append(next, [2]int{nr, nc})
			}
		}
		queue = next
		minutes++ // [2] one whole wave = one minute
	}

	if fresh == 0 {
		return minutes // [3] everything rotted
	}
	return -1 // [3] some fresh orange could not be reached
}
