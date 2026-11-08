package rotate_image

// rotateDriver copies every row first, so the caller's slices are never touched.
func rotateDriver(matrix [][]int) [][]int {
	m := make([][]int, len(matrix))
	for i, row := range matrix {
		m[i] = append([]int(nil), row...)
	}
	rotate(m)
	return m
}
