package trapping_rain_water

func trapPrefix(height []int) int {
	n := len(height)
	left := make([]int, n) // [1] left[i] = tallest bar from the start up to i
	for i := range height {
		left[i] = height[i]
		if i > 0 {
			left[i] = max(left[i-1], height[i])
		}
	}
	right := make([]int, n) // [2] right[i] = tallest bar from i to the end
	for i := n - 1; i >= 0; i-- {
		right[i] = height[i]
		if i < n-1 {
			right[i] = max(right[i+1], height[i])
		}
	}
	water := 0
	for i := range height {
		water += min(left[i], right[i]) - height[i] // [3] the lower of the two walls is the water level
	}
	return water // [4] total over all bars
}
