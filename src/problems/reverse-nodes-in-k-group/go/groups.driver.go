package reverse_nodes_in_k_group

func reverseKGroupDriver(vals []int, k int) []int {
	var head *ListNode
	for i := len(vals) - 1; i >= 0; i-- {
		head = &ListNode{Val: vals[i], Next: head}
	}
	out := []int{}
	for n := reverseKGroup(head, k); n != nil; n = n.Next {
		out = append(out, n.Val)
	}
	return out
}
