package longest_consecutive_sequence

func longestConsecutive(nums []int) int {
	set := make(map[int]struct{}, len(nums)) // [1] instant "is this number present?"
	for _, x := range nums {
		set[x] = struct{}{}
	}
	best := 0
	for x := range set {
		if _, ok := set[x-1]; ok { // [2] x-1 exists, so x is in the middle of a run. Skip it
			continue
		}
		end := x // [3] walk upward while the next number exists
		for {
			if _, ok := set[end+1]; !ok {
				break
			}
			end++
		}
		best = max(best, end-x+1) // [4] keep the longest run seen
	}
	return best
}
