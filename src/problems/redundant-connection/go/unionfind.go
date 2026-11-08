package redundant_connection

func findRedundantConnection(edges [][]int) []int {
	n := len(edges) // n nodes, numbered 1..n, and n edges
	parent := make([]int, n+1)
	for i := range parent {
		parent[i] = i // [1] every node starts as its own group leader
	}

	find := func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]] // [2] path halving: hop x closer to the root as we climb
			x = parent[x]
		}
		return x
	}

	for _, e := range edges {
		a, b := e[0], e[1]
		ra := find(a) // [2] leader of a's group
		rb := find(b) // [2] leader of b's group
		if ra == rb { // [3] already connected: this edge closes a loop
			return []int{a, b}
		}
		parent[ra] = rb // [4] different groups: merge them under one leader
	}
	return nil
}
