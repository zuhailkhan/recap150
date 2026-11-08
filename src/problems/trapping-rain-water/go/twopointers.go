package trapping_rain_water

func trap(height []int) int {
	l, r := 0, len(height)-1 // [1] pointers at both ends, no wall seen yet
	leftMax, rightMax, water := 0, 0, 0
	for l < r {
		if height[l] < height[r] { // [2] the lower side is safe to finish: the other side has a wall at least this tall
			leftMax = max(leftMax, height[l]) // [3] tallest wall seen on the left
			water += leftMax - height[l]      // [3] this bar holds water up to that wall
			l++
		} else {
			rightMax = max(rightMax, height[r]) // [3] tallest wall seen on the right
			water += rightMax - height[r]       // [3] this bar holds water up to that wall
			r--
		}
	}
	return water // [4] total over all bars
}
