package reconstruct_itinerary

import (
	"slices"
	"sort"
)

func findItinerary(tickets [][]string) []string {
	next := map[string][]string{}
	for _, tk := range tickets {
		next[tk[0]] = append(next[tk[0]], tk[1])
	}
	for _, dests := range next {
		// [1] smallest destination goes LAST, so taking the last item is O(1)
		sort.Sort(sort.Reverse(sort.StringSlice(dests)))
	}
	path := []string{"JFK"}
	route := []string{}
	for len(path) > 0 {
		here := path[len(path)-1]
		if dests := next[here]; len(dests) > 0 {
			path = append(path, dests[len(dests)-1]) // [2] fly the smallest unused ticket
			next[here] = dests[:len(dests)-1]
		} else {
			route = append(route, here) // [3] stuck: this airport goes at the END of what is left
			path = path[:len(path)-1]
		}
	}
	slices.Reverse(route) // [4] we filled the route from the back
	return route
}
