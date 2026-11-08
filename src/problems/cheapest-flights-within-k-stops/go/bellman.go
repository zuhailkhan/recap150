package cheapest_flights_within_k_stops

import (
	"math"
	"slices"
)

func findCheapestPrice(n int, flights [][]int, src int, dst int, k int) int {
	cost := make([]int, n) // cheapest known price to each city
	for i := range cost {
		cost[i] = math.MaxInt
	}
	cost[src] = 0 // [1] with zero flights we are only at the start
	for range k + 1 {
		next := slices.Clone(cost) // [2] read from cost, write to next: one flight added per round
		for _, f := range flights {
			from, to, price := f[0], f[1], f[2]
			if cost[from] != math.MaxInt && cost[from]+price < next[to] { // [3] one more flight, priced from LAST round's cost
				next[to] = cost[from] + price
			}
		}
		cost = next
	}
	if cost[dst] == math.MaxInt {
		return -1 // [4] unreachable within the limit
	}
	return cost[dst]
}
