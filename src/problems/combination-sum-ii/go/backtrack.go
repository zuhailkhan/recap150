package combination_sum_ii

import "sort"

func combinationSum2(candidates []int, target int) [][]int {
	sorted := append([]int{}, candidates...) // [1] sort a copy: equal numbers become neighbours
	sort.Ints(sorted)
	out := [][]int{}
	path := []int{}
	var walk func(start, left int)
	walk = func(start, left int) {
		if left == 0 { // [4] the path adds up to the target: save a copy
			out = append(out, append([]int{}, path...))
			return
		}
		for i := start; i < len(sorted); i++ {
			if i > start && sorted[i] == sorted[i-1] { // [3] same value was already tried at this depth: skip
				continue
			}
			if sorted[i] > left { // [3] too big, and so is everything after it: stop this loop
				break
			}
			path = append(path, sorted[i]) // [2] choose sorted[i], then look only at what follows it
			walk(i+1, left-sorted[i])
			path = path[:len(path)-1] // [5] undo the choice
		}
	}
	walk(0, target)
	return out // [5] all different combinations
}
