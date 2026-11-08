package rotate_image

func rotate(matrix [][]int) {
	n := len(matrix)
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j] // [1] transpose: swap across the diagonal
		}
	}
	for _, row := range matrix {
		for l, r := 0, len(row)-1; l < r; l, r = l+1, r-1 {
			row[l], row[r] = row[r], row[l] // [2] reverse each row
		}
	}
}
