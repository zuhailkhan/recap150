package reorder_list

func reorderListDriver(vals []int) []int {
	var head *ListNode
	for i := len(vals) - 1; i >= 0; i-- {
		head = &ListNode{Val: vals[i], Next: head}
	}
	reorderList(head)
	out := []int{}
	for n := head; n != nil; n = n.Next {
		out = append(out, n.Val)
	}
	return out
}
