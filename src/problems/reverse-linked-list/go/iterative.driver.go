package reverse_linked_list

func reverseListDriver(vals []int) []int {
	var head *ListNode
	for i := len(vals) - 1; i >= 0; i-- {
		head = &ListNode{Val: vals[i], Next: head}
	}
	out := []int{}
	for n := reverseList(head); n != nil; n = n.Next {
		out = append(out, n.Val)
	}
	return out
}
