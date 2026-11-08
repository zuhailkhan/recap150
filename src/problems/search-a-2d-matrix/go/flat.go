package search_a_2d_matrix

func searchMatrix(matrix [][]int, target int) bool {
	rows := len(matrix)
	if rows == 0 {
		return false
	}
	cols := len(matrix[0])
	l := 0             // [1] pretend the matrix is one sorted array of rows * cols items
	r := rows*cols - 1 // [1]
	for l <= r {       // [2] something is still live: look at its middle
		m := l + (r-l)/2
		row, col := m/cols, m%cols // [2] flat index -> row and column
		v := matrix[row][col]
		if v == target { // [4] found it: that is the answer
			return true
		}
		if v < target {
			l = m + 1 // [3] too small: drop the middle and everything before it
		} else {
			r = m - 1 // [3] too big: drop the middle and everything after it
		}
	}
	return false // [4] the live range is empty: not found
}
