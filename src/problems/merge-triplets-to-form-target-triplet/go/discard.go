package merge_triplets_to_form_target_triplet

func mergeTriplets(triplets [][]int, target []int) bool {
	var hit [3]bool // [1] slots where some usable triplet equals the target
	for _, tri := range triplets {
		if tri[0] > target[0] || tri[1] > target[1] || tri[2] > target[2] {
			continue // [2] too big in some slot: merging it would break that slot for good
		}
		for j := 0; j < 3; j++ {
			if tri[j] == target[j] { // [3] this safe triplet supplies slot j
				hit[j] = true
			}
		}
	}
	return hit[0] && hit[1] && hit[2] // [4] every slot must be matched
}
