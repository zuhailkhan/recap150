package number_of_islands

func numIslands(land [][]string) int {
	rows := len(land)
	if rows == 0 {
		return 0
	}
	cols := len(land[0])
	island := make([][]int, rows) // [1] island number of each cell, 0 = not claimed yet
	for r := range island {
		island[r] = make([]int, cols)
	}

	var flood func(r, c, id int)
	flood = func(r, c, id int) {
		if r < 0 || r >= rows || c < 0 || c >= cols {
			return // off the map
		}
		if land[r][c] != "1" || island[r][c] != 0 {
			return // water, or already claimed
		}
		island[r][c] = id // [3] claim this cell for the island
		flood(r+1, c, id)
		flood(r-1, c, id)
		flood(r, c+1, id)
		flood(r, c-1, id)
	}

	count := 0
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if land[r][c] == "1" && island[r][c] == 0 { // [2] unclaimed land: a new island starts here
				count++
				flood(r, c, count)
			}
		}
	}
	return count // [4] one count per flood that had to be started
}
