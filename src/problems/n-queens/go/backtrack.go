package n_queens

import "strings"

func solveNQueens(n int) [][]string {
	out := [][]string{}
	queens := make([]int, 0, n) // [1] queens[r] is the column of the queen in row r
	cols := make([]bool, n)     // columns that hold a queen
	down := make([]bool, 2*n-1) // r - c + (n - 1) is equal along a diagonal that runs down and to the right
	up := make([]bool, 2*n-1)   // r + c is equal along a diagonal that runs up and to the right
	var walk func(r int)
	walk = func(r int) {
		if r == n { // [4] every row has a queen: draw the board and save it
			board := make([]string, n)
			for i, c := range queens {
				board[i] = strings.Repeat(".", c) + "Q" + strings.Repeat(".", n-c-1)
			}
			out = append(out, board)
			return
		}
		for c := 0; c < n; c++ {
			if cols[c] || down[r-c+n-1] || up[r+c] { // [2] this square is attacked: skip it
				continue
			}
			queens = append(queens, c) // [3] place a queen and mark its column and both diagonals as attacked
			cols[c], down[r-c+n-1], up[r+c] = true, true, true
			walk(r + 1)
			queens = queens[:len(queens)-1] // [5] remove the queen and free its column and diagonals
			cols[c], down[r-c+n-1], up[r+c] = false, false, false
		}
	}
	walk(0)
	return out // [5] all boards
}
