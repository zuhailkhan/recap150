package k_closest_points_to_origin

import "sort"

// kClosestDriver sorts the answer, because the points may come out of the heap in any order.
func kClosestDriver(points [][]int, k int) [][]int {
	out := kClosest(points, k)
	sort.Slice(out, func(i, j int) bool {
		if out[i][0] != out[j][0] {
			return out[i][0] < out[j][0]
		}
		return out[i][1] < out[j][1]
	})
	return out
}
