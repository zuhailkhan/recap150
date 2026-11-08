package clone_graph

// cloneGraphDriver builds nodes from an adjacency list (node i+1 has neighbours adj[i]),
// clones them, checks the clone is a deep copy, and reads the adjacency list back.
// A shared node is reported as [[-1]] so the test fails.
func cloneGraphDriver(adj [][]int) [][]int {
	nodes := make([]*Node, len(adj))
	for i := range adj {
		nodes[i] = &Node{Val: i + 1}
	}
	originals := map[*Node]bool{}
	for i, ns := range adj {
		originals[nodes[i]] = true
		for _, v := range ns {
			nodes[i].Neighbors = append(nodes[i].Neighbors, nodes[v-1])
		}
	}
	var start *Node
	if len(nodes) > 0 {
		start = nodes[0]
	}
	clone := cloneGraph(start)
	out := make([][]int, len(adj))
	for i := range out {
		out[i] = []int{}
	}
	if clone == nil {
		return out
	}
	byVal := map[int]*Node{}
	queue := []*Node{clone}
	for len(queue) > 0 {
		n := queue[0]
		queue = queue[1:]
		if originals[n] {
			return [][]int{{-1}}
		}
		if known, ok := byVal[n.Val]; ok {
			if known != n {
				return [][]int{{-1}}
			}
			continue
		}
		byVal[n.Val] = n
		queue = append(queue, n.Neighbors...)
	}
	for v, n := range byVal {
		for _, x := range n.Neighbors {
			out[v-1] = append(out[v-1], x.Val)
		}
	}
	return out
}
