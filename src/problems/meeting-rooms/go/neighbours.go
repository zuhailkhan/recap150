package meeting_rooms

import "sort"

func canAttendMeetings(intervals [][]int) bool {
	sorted := append([][]int(nil), intervals...) // [1] sort a copy by start, so the caller's order stays
	sort.Slice(sorted, func(i, j int) bool { return sorted[i][0] < sorted[j][0] })
	for i := 1; i < len(sorted); i++ {
		if sorted[i][0] < sorted[i-1][1] { // [2] strict: starting exactly when the last one ends is fine
			return false // [3]
		}
	}
	return true // [3]
}
