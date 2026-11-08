package meeting_rooms_ii

import "sort"

func minMeetingRooms(intervals [][]int) int {
	starts := make([]int, len(intervals))
	ends := make([]int, len(intervals))
	for i, iv := range intervals {
		starts[i], ends[i] = iv[0], iv[1]
	}
	sort.Ints(starts) // [1] starts and ends sorted on their own; the pairing is not needed
	sort.Ints(ends)
	rooms := 0
	e := 0 // ends[e] is the earliest end that has not been matched to a start yet
	for _, s := range starts {
		if s < ends[e] { // [2] strict: a meeting starting exactly at an end can use that room
			rooms++ // [3] nothing has ended yet, so this meeting needs a new room
		} else {
			e++ // [4] a meeting has ended, so its room is free to reuse
		}
	}
	return rooms // [5]
}
