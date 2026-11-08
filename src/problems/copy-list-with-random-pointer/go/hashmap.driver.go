package copy_list_with_random_pointer

import "reflect"

func chainOf(head *Node) []*Node {
	var out []*Node
	for n := head; n != nil; n = n.Next {
		out = append(out, n)
	}
	return out
}

func flat(head *Node) [][]any {
	ns := chainOf(head)
	idx := map[*Node]int{}
	for i, n := range ns {
		idx[n] = i
	}
	out := [][]any{}
	for _, n := range ns {
		var r any
		if n.Random != nil {
			j, ok := idx[n.Random]
			if !ok {
				panic("random pointer leaves the list")
			}
			r = j
		}
		out = append(out, []any{n.Val, r})
	}
	return out
}

func copyRandomListDriver(pairs [][]any) [][]any {
	nodes := make([]*Node, len(pairs))
	for i, p := range pairs {
		nodes[i] = &Node{Val: int(p[0].(float64))}
	}
	for i, p := range pairs {
		if i+1 < len(nodes) {
			nodes[i].Next = nodes[i+1]
		}
		if p[1] != nil {
			nodes[i].Random = nodes[int(p[1].(float64))]
		}
	}
	var head *Node
	if len(nodes) > 0 {
		head = nodes[0]
	}
	dup := copyRandomList(head)
	old := map[*Node]bool{}
	for _, n := range nodes {
		old[n] = true
	}
	for _, n := range chainOf(dup) {
		if old[n] {
			panic("the copy shares a node with the original")
		}
	}
	out := flat(dup)
	if !reflect.DeepEqual(flat(head), out) {
		panic("the original list was changed")
	}
	return out
}
