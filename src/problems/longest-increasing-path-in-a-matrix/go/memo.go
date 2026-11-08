package longest_increasing_path_in_a_matrix

func longestIncreasingPath(matrix [][]int) int {
	rows := len(matrix)
	if rows == 0 {
		return 0
	}
	cols := len(matrix[0])
	// memo[r][c] = longest increasing path that starts at (r, c). 0 means "not computed yet": a real answer is at least 1
	memo := make([][]int, rows) // [1] one table cell per grid cell
	for r := range memo {
		memo[r] = make([]int, cols)
	}

	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	var dfs func(r, c int) int
	dfs = func(r, c int) int {
		if memo[r][c] != 0 { // [2] already solved: reuse the stored answer
			return memo[r][c]
		}
		best := 1 // a path of just this cell
		for _, d := range dirs {
			nr, nc := r+d[0], c+d[1]
			if nr < 0 || nr >= rows || nc < 0 || nc >= cols || matrix[nr][nc] <= matrix[r][c] {
				continue // off the grid, or not strictly bigger
			}
			best = max(best, 1+dfs(nr, nc)) // [3] step uphill: this cell plus the neighbour's best path
		}
		memo[r][c] = best // [4] the recursion has returned: store the answer
		return best
	}

	longest := 0
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			longest = max(longest, dfs(r, c)) // [5] try every start, the memo makes repeats free
		}
	}
	return longest // [5] 0 for an empty matrix
}
