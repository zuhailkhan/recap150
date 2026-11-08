package jump_game_ii

func jump(nums []int) int {
	last := len(nums) - 1
	jumps := 0                  // [1] jumps taken so far
	end := 0                    // [1] last index reachable with that many jumps (the current window)
	far := 0                    // [1] farthest index reachable with one more jump
	for i := 0; i < last; i++ { // stop before the last cell: no jump starts there
		far = max(far, i+nums[i]) // [2] the best a jump from anywhere in this window can do
		if i == end {             // [3] the window is used up: one more jump is forced
			jumps++
			end = far // [4] the next window runs up to far
		}
	}
	return jumps
}
