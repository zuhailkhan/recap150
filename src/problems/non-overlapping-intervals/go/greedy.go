package non_overlapping_intervals

import "sort"

func eraseOverlapIntervals(intervals [][]int) int {
	if len(intervals) == 0 {
		return 0
	}
	sorted := append([][]int(nil), intervals...) // [1] sort a copy by END: the interval that finishes first leaves the most room
	sort.Slice(sorted, func(i, j int) bool { return sorted[i][1] < sorted[j][1] })
	keptEnd := sorted[0][1] // the first one is always kept
	removed := 0
	for _, cur := range sorted[1:] {
		if cur[0] >= keptEnd { // [2] no overlap with the last kept interval
			keptEnd = cur[1] // [3] keep it, and move the line to its end
		} else {
			removed++ // [4] overlaps the kept one, which ends no later: drop this one
		}
	}
	return removed // [5]
}
