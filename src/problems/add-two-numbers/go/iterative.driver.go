package add_two_numbers

func buildList(vals []int) *ListNode {
	var head *ListNode
	for i := len(vals) - 1; i >= 0; i-- {
		head = &ListNode{Val: vals[i], Next: head}
	}
	return head
}

func addTwoNumbersDriver(a []int, b []int) []int {
	out := []int{}
	for n := addTwoNumbers(buildList(a), buildList(b)); n != nil; n = n.Next {
		out = append(out, n.Val)
	}
	return out
}
