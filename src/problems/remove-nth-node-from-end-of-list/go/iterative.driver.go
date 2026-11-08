package remove_nth_node_from_end_of_list

func removeNthFromEndDriver(vals []int, n int) []int {
	var head *ListNode
	for i := len(vals) - 1; i >= 0; i-- {
		head = &ListNode{Val: vals[i], Next: head}
	}
	out := []int{}
	for p := removeNthFromEnd(head, n); p != nil; p = p.Next {
		out = append(out, p.Val)
	}
	return out
}
