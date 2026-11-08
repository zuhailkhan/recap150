package set_matrix_zeroes

func setZeroes(matrix [][]int) {
	rows, cols := len(matrix), len(matrix[0])
	firstRow, firstCol := false, false
	for c := 0; c < cols; c++ {
		if matrix[0][c] == 0 {
			firstRow = true // [1] does row 0 hold a zero of its own?
		}
	}
	for r := 0; r < rows; r++ {
		if matrix[r][0] == 0 {
			firstCol = true // [1] does column 0?
		}
	}
	for r := 1; r < rows; r++ {
		for c := 1; c < cols; c++ {
			if matrix[r][c] == 0 {
				matrix[r][0] = 0 // [2] a zero at (r, c) marks its row in column 0
				matrix[0][c] = 0 // [2] and its column in row 0
			}
		}
	}
	for r := 1; r < rows; r++ {
		for c := 1; c < cols; c++ {
			if matrix[r][0] == 0 || matrix[0][c] == 0 {
				matrix[r][c] = 0 // [3] a marker for this row or column says wipe
			}
		}
	}
	if firstRow {
		for c := 0; c < cols; c++ {
			matrix[0][c] = 0 // [4] row 0 had its own zero, so wipe it last
		}
	}
	if firstCol {
		for r := 0; r < rows; r++ {
			matrix[r][0] = 0 // [4] column 0 had its own zero, so wipe it last
		}
	}
}
