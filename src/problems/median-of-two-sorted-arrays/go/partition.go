package median_of_two_sorted_arrays

import "math"

func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
	a, b := nums1, nums2
	if len(a) > len(b) {
		a, b = b, a // [1] a is the shorter one, so b is never too short for the cut
	}
	total := len(a) + len(b)
	half := (total + 1) / 2 // [1] the left side holds this many items in total
	l := 0                  // [2] cut positions in a: 0 (before everything) to len(a) (after everything)
	r := len(a)             // [2]
	for l <= r {
		i := l + (r-l)/2 // [3] cut a after i items. Then b must be cut after half - i
		j := half - i
		aLeft, aRight := math.MinInt, math.MaxInt // [3] the item just left of each cut, and just right of it
		bLeft, bRight := math.MinInt, math.MaxInt
		if i > 0 {
			aLeft = a[i-1]
		}
		if i < len(a) {
			aRight = a[i]
		}
		if j > 0 {
			bLeft = b[j-1]
		}
		if j < len(b) {
			bRight = b[j]
		}
		tooFar := aLeft > bRight   // [4] a's left item must not beat b's right item
		tooShort := bLeft > aRight // [4] b's left item must not beat a's right item
		if tooFar {
			r = i - 1 // [4] move a's cut left (and b's cut moves right with it)
		} else if tooShort {
			l = i + 1 // [4] move a's cut right
		} else {
			leftMax := max(aLeft, bLeft) // [5] the median comes from the four items beside the cuts
			if total%2 == 1 {
				return float64(leftMax)
			}
			return float64(leftMax+min(aRight, bRight)) / 2
		}
	}
	panic("both arrays must be sorted")
}
