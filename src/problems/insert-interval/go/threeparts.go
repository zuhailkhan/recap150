package insert_interval

func insert(intervals [][]int, newInterval []int) [][]int {
	res := [][]int{}
	start, end := newInterval[0], newInterval[1] // two plain ints, so the input slice is never edited
	i := 0
	for i < len(intervals) && intervals[i][1] < start { // [1] ends strictly before the new start: no touching, keep as is
		res = append(res, []int{intervals[i][0], intervals[i][1]})
		i++
	}
	for i < len(intervals) && intervals[i][0] <= end { // [2] starts at or before the new end: overlaps (touching counts), absorb it
		start = min(start, intervals[i][0])
		end = max(end, intervals[i][1])
		i++
	}
	res = append(res, []int{start, end}) // [3] the grown interval goes in after everything to its left
	for ; i < len(intervals); i++ {      // [4] everything left starts after the new end: copy it
		res = append(res, []int{intervals[i][0], intervals[i][1]})
	}
	return res // [4]
}
