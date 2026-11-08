package subsets_ii

import "sort"

func subsetsWithDup(nums []int) [][]int {
	sorted := append([]int{}, nums...) // [1] sort a copy so equal numbers sit side by side
	sort.Ints(sorted)
	out := [][]int{}
	path := []int{}
	var walk func(start int)
	walk = func(start int) {
		out = append(out, append([]int{}, path...)) // [4] every path is a subset: save a copy
		for i := start; i < len(sorted); i++ {
			if i > start && sorted[i] == sorted[i-1] { // [3] same value was already tried at this depth: skip
				continue
			}
			path = append(path, sorted[i]) // [2] choose sorted[i], then look only at what follows it
			walk(i + 1)
			path = path[:len(path)-1] // [5] undo the choice
		}
	}
	walk(0)
	return out // [5] all different subsets
}
