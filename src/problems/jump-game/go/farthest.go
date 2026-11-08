package jump_game

func canJump(nums []int) bool {
	last := len(nums) - 1
	far := 0 // [1] the farthest index any jump so far can reach
	for i := 0; i <= last; i++ {
		if i > far { // [2] beyond the reach: nothing before can land here, so nothing after can either
			return false
		}
		far = max(far, i+nums[i]) // [3] standing on i, I can reach i + nums[i]
		if far >= last {          // [4] the goal is inside the reach: done
			return true
		}
	}
	return true
}
