package container_with_most_water

func maxArea(heights []int) int {
	l, r := 0, len(heights)-1 // [1] start with the widest container
	best := 0
	for l < r {
		h := min(heights[l], heights[r]) // [2] the shorter wall sets the water level
		area := (r - l) * h              // [2] width times the shorter wall
		best = max(best, area)           // [3] remember the largest area seen
		if heights[l] <= heights[r] {    // [4] the shorter wall caps every container it is part of, so drop it
			l++
		} else {
			r--
		}
	}
	return best
}
