package palindrome_partitioning

import (
	"sort"
	"strings"
)

// The order of pieces matters, so sort the outer list by the pieces joined with "|".
func partitionDriver(s string) [][]string {
	out := partition(s)
	sort.Slice(out, func(i, j int) bool { return strings.Join(out[i], "|") < strings.Join(out[j], "|") })
	return out
}
