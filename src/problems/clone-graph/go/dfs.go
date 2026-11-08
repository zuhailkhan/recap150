package clone_graph

type Node struct {
	Val       int
	Neighbors []*Node
}

func cloneGraph(node *Node) *Node {
	if node == nil {
		return nil // nothing to copy
	}
	copies := map[*Node]*Node{} // [1] original node -> its copy

	var dup func(n *Node) *Node
	dup = func(n *Node) *Node {
		if made, ok := copies[n]; ok {
			return made // [3] already copied: reuse it
		}
		clone := &Node{Val: n.Val} // [2] a new copy with no links yet
		copies[n] = clone          // [2] register it before visiting neighbours
		for _, next := range n.Neighbors {
			clone.Neighbors = append(clone.Neighbors, dup(next)) // [4] link the copy to the copies of its neighbours
		}
		return clone
	}
	return dup(node)
}
