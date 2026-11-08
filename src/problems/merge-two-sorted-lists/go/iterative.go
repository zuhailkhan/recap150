package merge_two_sorted_lists

type ListNode struct {
	Val  int
	Next *ListNode
}

func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
	dummy := &ListNode{} // [1] a fake head, so the first pick is not a special case
	tail := dummy        // [1] the last node of the merged list
	for list1 != nil && list2 != nil {
		var pick *ListNode
		if list1.Val <= list2.Val { // [2] take the smaller front node
			pick = list1
			list1 = list1.Next
		} else {
			pick = list2
			list2 = list2.Next
		}
		tail.Next = pick // [2] link it after tail
		tail = pick      // [3] tail is now the new last node
	}
	if list1 != nil { // [4] one list is empty. Hang the other one on as it is
		tail.Next = list1
	} else {
		tail.Next = list2
	}
	return dummy.Next // [5] skip the fake head
}
