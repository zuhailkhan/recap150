package word_search

// existDriver turns the JSON board of one-letter strings into bytes.
func existDriver(board [][]string, word string) bool {
	grid := make([][]byte, len(board))
	for r, row := range board {
		grid[r] = make([]byte, len(row))
		for c, cell := range row {
			grid[r][c] = cell[0]
		}
	}
	return exist(grid, word)
}
