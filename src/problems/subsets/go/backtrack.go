package subsets

func subsets(nums []int) [][]int {
	out := [][]int{}
	path := []int{} // [1] the numbers taken so far
	var walk func(i int)
	walk = func(i int) {
		if i == len(nums) { // [4] every number is decided: the path is one finished subset
			out = append(out, append([]int{}, path...)) // copy it: path shares one backing array that keeps changing
			return
		}
		path = append(path, nums[i]) // [2] take nums[i], then decide the rest
		walk(i + 1)
		path = path[:len(path)-1] // [3] undo the take, then decide the rest without nums[i]
		walk(i + 1)
	}
	walk(0)
	return out // [4] all subsets
}
