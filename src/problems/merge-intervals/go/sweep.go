package merge_intervals

import "sort"

func merge(intervals [][]int) [][]int {
	sorted := append([][]int(nil), intervals...) // [1] sort a copy by start, so the caller's order stays
	sort.Slice(sorted, func(i, j int) bool { return sorted[i][0] < sorted[j][0] })
	res := [][]int{}
	for _, cur := range sorted {
		start, end := cur[0], cur[1]
		if len(res) > 0 && start <= res[len(res)-1][1] { // [2] touching counts as overlap
			last := res[len(res)-1]
			last[1] = max(last[1], end) // [3] overlap: stretch the last interval, never shrink it
		} else {
			res = append(res, []int{start, end}) // [4] gap: start a new merged interval (a fresh slice, not the input's)
		}
	}
	return res // [5]
}
