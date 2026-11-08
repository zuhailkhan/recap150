export function canJumpGoal(nums: number[]): boolean {
  let goal = nums.length - 1 // [1] the cell I still need to be able to reach
  for (let i = nums.length - 2; i >= 0; i--) { // [2] look at each earlier cell, right to left
    if (i + nums[i] >= goal) goal = i // [3] i can reach the goal, so reaching i is enough
  }
  return goal === 0 // [4] was the start pulled all the way down to index 0?
}
