package graph_valid_tree

func validTree(n int, edges [][]int) bool {
	if len(edges) != n-1 { // [1] wrong edge count: too few can't connect, too many must loop
		return false
	}

	adj := make([][]int, n) // [2] neighbours of every node
	for _, e := range edges {
		adj[e[0]] = append(adj[e[0]], e[1])
		adj[e[1]] = append(adj[e[1]], e[0])
	}
	seen := make([]bool, n)
	queue := []int{0} // [2] start the walk at node 0
	seen[0] = true

	for head := 0; head < len(queue); head++ {
		v := queue[head] // [3] take the next node from the front
		for _, w := range adj[v] {
			if !seen[w] { // [4] a new node: mark it and queue it
				seen[w] = true
				queue = append(queue, w)
			}
		}
	}
	return len(queue) == n // [5] reached everything: connected
}
