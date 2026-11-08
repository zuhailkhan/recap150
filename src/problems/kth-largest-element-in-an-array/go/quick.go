package kth_largest_element_in_an_array

// partitionAround rearranges a[lo..hi] around one pivot. Smaller values end up left of it.
// It returns the pivot's final index.
func partitionAround(a []int, lo, hi int) int {
	mid := (lo + hi) / 2
	a[mid], a[hi] = a[hi], a[mid] // park the middle value at the end as the pivot
	pivot := a[hi]
	i := lo
	for j := lo; j < hi; j++ {
		if a[j] < pivot {
			a[i], a[j] = a[j], a[i]
			i++
		}
	}
	a[i], a[hi] = a[hi], a[i] // the pivot goes between the smaller values and the rest
	return i
}

func findKthLargestQuick(nums []int, k int) int {
	a := append([]int(nil), nums...) // quickselect reorders, so work on a copy
	target := len(a) - k             // [1] in sorted order the kth largest sits at this index
	lo, hi := 0, len(a)-1
	for {
		p := partitionAround(a, lo, hi) // [2] one pivot lands in its final sorted place
		if p == target {
			return a[p] // [4] the pivot is in the target place
		}
		if p < target {
			lo = p + 1 // [3] the target is to the right: drop the left side
		} else {
			hi = p - 1 // [3] the target is to the left: drop the right side
		}
	}
}
