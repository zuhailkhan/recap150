package min_cost_to_connect_all_points

import "math"

func minCostConnectPoints(points [][]int) int {
	n := len(points)
	dist := make([]int, n) // cheapest known link from each point to the tree
	for i := range dist {
		dist[i] = math.MaxInt
	}
	inTree := make([]bool, n)
	dist[0] = 0 // [1] the tree starts as point 0 alone
	total := 0
	for range n {
		u := -1
		for i := 0; i < n; i++ {
			if !inTree[i] && (u == -1 || dist[i] < dist[u]) { // [2] the outside point that is cheapest to reach
				u = i
			}
		}
		inTree[u] = true
		total += dist[u]
		for v := 0; v < n; v++ {
			d := abs(points[u][0]-points[v][0]) + abs(points[u][1]-points[v][1])
			if !inTree[v] && d < dist[v] { // [3] point u may be a cheaper way in for point v
				dist[v] = d
			}
		}
	}
	return total // [4] n points need n-1 links, and we paid for the cheapest ones
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
