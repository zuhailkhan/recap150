package permutations

func permute(nums []int) [][]int {
	out := [][]int{}
	path := []int{} // [1] the order built so far
	used := make([]bool, len(nums))
	var walk func()
	walk = func() {
		if len(path) == len(nums) { // [4] every slot is filled: save a copy
			out = append(out, append([]int{}, path...))
			return
		}
		for i := range nums {
			if used[i] { // [3] already in the path: skip it
				continue
			}
			used[i] = true // [2] choose nums[i] for this slot
			path = append(path, nums[i])
			walk()
			path = path[:len(path)-1] // [5] undo: take it out and free the number again
			used[i] = false
		}
	}
	walk()
	return out // [5] all orders
}
