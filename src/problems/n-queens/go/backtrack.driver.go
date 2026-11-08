package n_queens

import (
	"sort"
	"strings"
)

// The rows of a board have a fixed order, so sort the list of boards by the rows joined with "/".
func solveNQueensDriver(n int) [][]string {
	out := solveNQueens(n)
	sort.Slice(out, func(i, j int) bool { return strings.Join(out[i], "/") < strings.Join(out[j], "/") })
	return out
}
