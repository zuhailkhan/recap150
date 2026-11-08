package reorder_list

type ListNode struct {
	Val  int
	Next *ListNode
}

func reorderList(head *ListNode) {
	if head == nil || head.Next == nil {
		return
	}
	slow, fast := head, head.Next // [1] slow takes one step, fast takes two
	for fast != nil && fast.Next != nil {
		slow = slow.Next // [1] when fast hits the end, slow is at the middle
		fast = fast.Next.Next
	}
	var prev *ListNode // [2] reverse the second half in place
	cur := slow.Next   // [2] second half starts after slow
	slow.Next = nil    // [2] cut the list in two
	for cur != nil {
		next := cur.Next
		cur.Next = prev
		prev = cur
		cur = next
	}
	first, second := head, prev // [3] weave: one from the front, one from the back
	for first != nil && second != nil {
		n1, n2 := first.Next, second.Next
		first.Next = second // [3] first -> second
		second.Next = n1    // [3] second -> the rest of the first half
		first, second = n1, n2
	}
}
