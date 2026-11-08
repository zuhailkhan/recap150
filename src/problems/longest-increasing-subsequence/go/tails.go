package longest_increasing_subsequence

import "sort"

func lengthOfLISTails(nums []int) int {
	tails := []int{} // [1] tails[k] = smallest last number of any increasing run of length k + 1
	for _, x := range nums {
		// [2] binary search for the first tail that is >= x
		lo := sort.Search(len(tails), func(k int) bool { return tails[k] >= x })
		if lo == len(tails) {
			tails = append(tails, x) // [3] x beats every tail: the longest run grows by one
		} else {
			tails[lo] = x // [3] otherwise x is a smaller tail for runs of that length
		}
	}
	return len(tails) // [4] the longest run's length
}
