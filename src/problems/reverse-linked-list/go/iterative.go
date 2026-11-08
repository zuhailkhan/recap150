package reverse_linked_list

type ListNode struct {
	Val  int
	Next *ListNode
}

func reverseList(head *ListNode) *ListNode {
	var prev *ListNode // [1] the reversed part, empty so far
	cur := head        // [1] the node we are about to flip
	for cur != nil {
		next := cur.Next // [2] remember the rest before cutting the link
		cur.Next = prev  // [3] flip: point this node backwards
		prev = cur       // [4] step forward: cur joins the reversed part
		cur = next
	}
	return prev // [5] prev is the new head
}
