package permutations

import (
	"sort"
	"strconv"
	"strings"
)

// The order inside each permutation matters, so sort the outer list by the joined numbers.
func permuteDriver(nums []int) [][]int {
	out := permute(nums)
	key := func(p []int) string {
		parts := make([]string, len(p))
		for i, x := range p {
			parts[i] = strconv.Itoa(x)
		}
		return strings.Join(parts, ",")
	}
	sort.Slice(out, func(i, j int) bool { return key(out[i]) < key(out[j]) })
	return out
}
