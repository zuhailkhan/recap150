package set_matrix_zeroes

// setZeroesDriver copies every row first, so the caller's slices are never touched.
func setZeroesDriver(matrix [][]int) [][]int {
	m := make([][]int, len(matrix))
	for i, row := range matrix {
		m[i] = append([]int(nil), row...)
	}
	setZeroes(m)
	return m
}
