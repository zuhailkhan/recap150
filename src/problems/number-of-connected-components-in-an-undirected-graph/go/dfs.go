package number_of_connected_components_in_an_undirected_graph

func countComponents(n int, edges [][]int) int {
	adj := make([][]int, n) // [1] neighbours of every node
	for _, e := range edges {
		adj[e[0]] = append(adj[e[0]], e[1])
		adj[e[1]] = append(adj[e[1]], e[0])
	}

	group := make([]int, n) // group[v] = which component v was reached in. 0 = not reached yet
	count := 0
	for start := 0; start < n; start++ {
		if group[start] != 0 {
			continue
		}
		count++ // [2] start is in a group nobody has reached: a new component
		group[start] = count
		todo := []int{start}
		for len(todo) > 0 {
			v := todo[len(todo)-1] // [3] take a node and look at its neighbours
			todo = todo[:len(todo)-1]
			for _, w := range adj[v] {
				if group[w] == 0 { // [4] unseen neighbour: it is in this component too
					group[w] = count
					todo = append(todo, w)
				}
			}
		}
	}
	return count // [5] one start per component
}
