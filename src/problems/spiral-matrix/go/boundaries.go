package spiral_matrix

func spiralOrder(matrix [][]int) []int {
	out := []int{}
	top, bottom := 0, len(matrix)-1
	left, right := 0, len(matrix[0])-1
	for top <= bottom && left <= right { // [1] stop when the fences cross
		for c := left; c <= right; c++ {
			out = append(out, matrix[top][c]) // [2] top row, left to right
		}
		top++
		for r := top; r <= bottom; r++ {
			out = append(out, matrix[r][right]) // [3] right column, top to bottom
		}
		right--
		if top <= bottom { // [4] a bottom row is left only if the fences have not crossed
			for c := right; c >= left; c-- {
				out = append(out, matrix[bottom][c]) // [4] bottom row, right to left
			}
			bottom--
		}
		if left <= right { // [5] a left column is left only if the fences have not crossed
			for r := bottom; r >= top; r-- {
				out = append(out, matrix[r][left]) // [5] left column, bottom to top
			}
			left++
		}
	}
	return out
}
