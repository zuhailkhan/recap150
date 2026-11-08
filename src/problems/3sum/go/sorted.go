package p_3sum

import "sort"

func threeSum(nums []int) [][]int {
	a := append([]int(nil), nums...) // copy, so the caller's slice keeps its order
	sort.Ints(a)                     // [1] sorted, so equal values sit side by side and two pointers work
	out := [][]int{}
	for i := 0; i < len(a)-2; i++ {
		if i > 0 && a[i] == a[i-1] { // [2] same first number as last time: every triple would repeat
			continue
		}
		l, r := i+1, len(a)-1 // [3] two pointers search the rest for a pair that sums to -a[i]
		for l < r {
			sum := a[i] + a[l] + a[r]
			if sum < 0 { // [3] too small: need a bigger number, move l right
				l++
			} else if sum > 0 { // [3] too big: need a smaller number, move r left
				r--
			} else {
				out = append(out, []int{a[i], a[l], a[r]}) // [4] sum is zero: record the triple
				l++
				r--
				for l < r && a[l] == a[l-1] {
					l++ // [5] step past repeats of the value just used on the left
				}
				for l < r && a[r] == a[r+1] {
					r-- // [5] same on the right
				}
			}
		}
	}
	return out
}
