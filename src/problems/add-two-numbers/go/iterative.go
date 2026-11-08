package add_two_numbers

type ListNode struct {
	Val  int
	Next *ListNode
}

func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
	dummy := &ListNode{} // [1] a fake head for the answer
	tail := dummy        // [1] the last node of the answer
	carry := 0           // [1] what we carry to the next column
	for l1 != nil || l2 != nil || carry > 0 {
		sum := carry // [2] one column: digit + digit + carry
		if l1 != nil {
			sum += l1.Val
		}
		if l2 != nil {
			sum += l2.Val
		}
		carry = sum / 10                     // [3] the tens part carries on
		tail.Next = &ListNode{Val: sum % 10} // [3] the ones part is the digit we keep
		tail = tail.Next
		if l1 != nil { // [4] move to the next column
			l1 = l1.Next
		}
		if l2 != nil {
			l2 = l2.Next
		}
	}
	return dummy.Next // [5] skip the fake head
}
