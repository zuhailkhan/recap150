package jump_game

func canJumpGoal(nums []int) bool {
	goal := len(nums) - 1                 // [1] the cell I still need to be able to reach
	for i := len(nums) - 2; i >= 0; i-- { // [2] look at each earlier cell, right to left
		if i+nums[i] >= goal { // [3] i can reach the goal, so reaching i is enough
			goal = i
		}
	}
	return goal == 0 // [4] was the start pulled all the way down to index 0?
}
