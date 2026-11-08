package linked_list_cycle

func hasCycleDriver(vals []int, pos int) bool {
	nodes := make([]*ListNode, len(vals))
	for i, v := range vals {
		nodes[i] = &ListNode{Val: v}
		if i > 0 {
			nodes[i-1].Next = nodes[i]
		}
	}
	if len(nodes) == 0 {
		return hasCycle(nil)
	}
	if pos >= 0 {
		nodes[len(nodes)-1].Next = nodes[pos]
	}
	return hasCycle(nodes[0])
}
