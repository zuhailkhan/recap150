package remove_nth_node_from_end_of_list

type ListNode struct {
	Val  int
	Next *ListNode
}

func removeNthFromEnd(head *ListNode, n int) *ListNode {
	dummy := &ListNode{Next: head} // [1] a fake head, so removing the real head is not special
	slow := dummy                  // [1] slow will stop one node before the one to remove
	fast := dummy                  // [1] fast runs ahead
	for i := 0; i < n; i++ {
		fast = fast.Next // [2] open a gap of n nodes between slow and fast
	}
	for fast.Next != nil {
		slow = slow.Next // [3] move both until fast is on the last node
		fast = fast.Next
	}
	slow.Next = slow.Next.Next // [4] skip over the node
	return dummy.Next          // [5] the real head (it may have changed)
}
