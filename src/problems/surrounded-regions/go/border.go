package surrounded_regions

var dirs = [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

func solve(board [][]string) [][]string {
	rows := len(board)
	if rows == 0 {
		return [][]string{}
	}
	cols := len(board[0])
	safe := make([][]bool, rows) // safe[r][c]: this O is connected to the border
	for r := range safe {
		safe[r] = make([]bool, cols)
	}

	var frontier [][2]int
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			onBorder := r == 0 || r == rows-1 || c == 0 || c == cols-1
			if onBorder && board[r][c] == "O" { // [1] an O on the border can never be surrounded
				safe[r][c] = true
				frontier = append(frontier, [2]int{r, c})
			}
		}
	}

	for len(frontier) > 0 {
		var next [][2]int
		for _, cur := range frontier {
			for _, d := range dirs {
				nr, nc := cur[0]+d[0], cur[1]+d[1]
				if nr < 0 || nr >= rows || nc < 0 || nc >= cols {
					continue // off the board
				}
				if board[nr][nc] == "O" && !safe[nr][nc] { // [2] an O touching a safe O is safe too
					safe[nr][nc] = true
					next = append(next, [2]int{nr, nc})
				}
			}
		}
		frontier = next
	}

	// [3] every O that is not safe is surrounded: flip it to X
	result := make([][]string, rows)
	for r := range result {
		result[r] = make([]string, cols)
		for c := range result[r] {
			result[r][c] = board[r][c]
			if board[r][c] == "O" && !safe[r][c] {
				result[r][c] = "X"
			}
		}
	}
	return result
}
