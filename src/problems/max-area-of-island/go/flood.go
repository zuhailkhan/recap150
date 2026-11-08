package max_area_of_island

func maxAreaOfIsland(land [][]int) int {
	rows := len(land)
	if rows == 0 {
		return 0
	}
	cols := len(land[0])
	owner := make([][]int, rows) // [1] island number of each cell, 0 = not claimed yet
	for r := range owner {
		owner[r] = make([]int, cols)
	}

	// area claims every land cell connected to (r, c) and returns how many it claimed
	var area func(r, c, id int) int
	area = func(r, c, id int) int {
		if r < 0 || r >= rows || c < 0 || c >= cols {
			return 0 // off the map
		}
		if land[r][c] != 1 || owner[r][c] != 0 {
			return 0 // water, or already counted
		}
		owner[r][c] = id                                                                     // [3] claim this cell
		return 1 + area(r+1, c, id) + area(r-1, c, id) + area(r, c+1, id) + area(r, c-1, id) // [3] this cell plus what its neighbours add
	}

	best, islands := 0, 0
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if land[r][c] == 1 && owner[r][c] == 0 { // [2] unclaimed land: a new island starts here
				islands++
				size := area(r, c, islands) // [3] flood and count
				best = max(best, size)      // [4] keep the biggest area seen
			}
		}
	}
	return best // [4] 0 when there is no land at all
}
