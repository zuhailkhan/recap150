package reverse_nodes_in_k_group

type ListNode struct {
	Val  int
	Next *ListNode
}

func reverseKGroup(head *ListNode, k int) *ListNode {
	dummy := &ListNode{Next: head}
	groupPrev := dummy // [1] the node just before the next group
	for {
		kth := groupPrev // [1] walk k steps to find the last node of the group
		for i := 0; i < k && kth != nil; i++ {
			kth = kth.Next
		}
		if kth == nil {
			break // [1] a short tail stays unreversed
		}
		groupNext := kth.Next                  // [2] remember the node after the group
		prev, cur := groupNext, groupPrev.Next // [2] start prev at groupNext, so the first flipped node points past the group
		for cur != groupNext {
			next := cur.Next // [2] standard reversal, but stop at the end of the group
			cur.Next = prev
			prev = cur
			cur = next
		}
		front := groupPrev.Next // [3] the old first node is now the group's last node
		groupPrev.Next = kth    // [3] stitch: the block before points at the group's new first node
		groupPrev = front
	}
	return dummy.Next // [4] the dummy hides the head change
}
