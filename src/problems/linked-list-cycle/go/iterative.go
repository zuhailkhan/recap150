package linked_list_cycle

type ListNode struct {
	Val  int
	Next *ListNode
}

func hasCycle(head *ListNode) bool {
	slow, fast := head, head // [1] two runners start on the same node
	for fast != nil && fast.Next != nil {
		slow = slow.Next      // [2] slow walks 1 node
		fast = fast.Next.Next // [2] fast walks 2 nodes
		if slow == fast {     // [3] the same node, not just the same value
			return true // [4] they met, so there is a cycle
		}
	}
	return false // [4] fast fell off the end, so the list ends
}
