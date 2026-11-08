package largest_rectangle_in_histogram

func largestRectangleArea(heights []int) int {
	stack := []int{} // [1] indices of bars, heights rising from bottom to top
	best := 0
	for i := 0; i <= len(heights); i++ {
		h := 0 // [1] a height-0 bar past the end
		if i < len(heights) {
			h = heights[i]
		}
		for len(stack) > 0 && h < heights[stack[len(stack)-1]] { // [2] a shorter bar ends the rectangle of the bar on top
			top := stack[len(stack)-1] // [2] pop it
			stack = stack[:len(stack)-1]
			height := heights[top]
			left := -1 // [3] the nearest shorter bar on the left
			if len(stack) > 0 {
				left = stack[len(stack)-1]
			}
			width := i - left - 1          // [3] the rectangle covers every bar between left and i
			best = max(best, height*width) // [3] keep the biggest area seen
		}
		stack = append(stack, i) // [4] bar i can still grow right. Keep it
	}
	return best // [5] the biggest area seen
}
