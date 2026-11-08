package valid_sudoku

func isValidSudoku(board [][]string) bool {
	var rows, cols, boxes [9][9]bool // [1] rows[r][d]: digit d seen in row r. Same for columns and boxes
	for r := 0; r < 9; r++ {
		for c := 0; c < 9; c++ {
			if board[r][c] == "." {
				continue // empty cells have no digit to check
			}
			d := board[r][c][0] - '1'                    // digit 1..9 becomes index 0..8
			b := r/3*3 + c/3                             // [2] which 3x3 box holds this cell
			if rows[r][d] || cols[c][d] || boxes[b][d] { // [3] seen in its row, column or box
				return false
			}
			rows[r][d], cols[c][d], boxes[b][d] = true, true, true // [4] remember the digit in all three
		}
	}
	return true // [3] nothing clashed
}
