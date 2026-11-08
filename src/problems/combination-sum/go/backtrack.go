package combination_sum

func combinationSum(candidates []int, target int) [][]int {
	out := [][]int{}
	path := []int{} // [1] the numbers picked so far
	var walk func(start, left int)
	walk = func(start, left int) {
		if left == 0 { // [4] the path adds up to the target: save a copy
			out = append(out, append([]int{}, path...))
			return
		}
		for i := start; i < len(candidates); i++ {
			if candidates[i] > left { // [3] too big: this pick would overshoot, skip it
				continue
			}
			path = append(path, candidates[i]) // [2] pick candidates[i]
			walk(i, left-candidates[i])        // pass i, not i + 1: the same number may be used again
			path = path[:len(path)-1]          // [5] undo the pick, then try the next candidate
		}
	}
	walk(0, target)
	return out // [5] all combinations
}
