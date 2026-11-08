package sliding_window_maximum

func maxSlidingWindow(nums []int, k int) []int {
	out := []int{}
	dq := []int{} // [1] indexes of candidates. Their values shrink from front to back
	for right := range nums {
		for len(dq) > 0 && nums[dq[len(dq)-1]] <= nums[right] { // [2] smaller or equal values behind the new one can never be the max
			dq = dq[:len(dq)-1]
		}
		dq = append(dq, right) // [3] the new index joins at the back
		if dq[0] <= right-k {  // [4] the front index slid out of the window: remove it
			dq = dq[1:]
		}
		if right >= k-1 { // [5] the window is full: its max is at the front
			out = append(out, nums[dq[0]])
		}
	}
	return out
}
