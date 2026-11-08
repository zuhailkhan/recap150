package contains_duplicate

func containsDuplicate(nums []int) bool {
	seen := map[int]struct{}{} // [1] numbers already passed; Go has no set type
	for _, x := range nums {   // [2] look at the next number
		if _, ok := seen[x]; ok { // [3] met this value before: duplicate
			return true
		}
		seen[x] = struct{}{} // [4] new value: remember it
	}
	return false // [3] no repeat anywhere
}
