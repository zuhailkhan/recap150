package koko_eating_bananas

func minEatingSpeed(piles []int, h int) int {
	l := 1 // [1] candidate speeds run from 1 to the biggest pile
	r := 0 // [1]
	for _, p := range piles {
		if p > r {
			r = p
		}
	}
	best := r    // [1] the biggest pile always works, since h >= len(piles)
	for l <= r { // [2] speeds in l..r are still undecided
		m := l + (r-l)/2
		hours := 0
		for _, p := range piles {
			hours += (p + m - 1) / m // [3] each pile takes ceil(pile / speed) hours
		}
		if hours <= h { // [4] fast enough: remember it, then look for something slower
			best = m
			r = m - 1
		} else {
			l = m + 1 // [4] too slow: every speed up to m is too slow
		}
	}
	return best // [5] the slowest speed that still finishes in time
}
