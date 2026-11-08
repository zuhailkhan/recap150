package merge_k_sorted_lists

import "container/heap"

type ListNode struct {
	Val  int
	Next *ListNode
}

// nodeHeap is a min-heap of nodes ordered by Val. Go's container/heap needs these five methods.
type nodeHeap []*ListNode

func (h nodeHeap) Len() int           { return len(h) }
func (h nodeHeap) Less(i, j int) bool { return h[i].Val < h[j].Val }
func (h nodeHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *nodeHeap) Push(x any)        { *h = append(*h, x.(*ListNode)) }
func (h *nodeHeap) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

func mergeKLists(lists []*ListNode) *ListNode {
	h := &nodeHeap{}
	for _, head := range lists {
		if head != nil {
			heap.Push(h, head) // [1] the heap holds one candidate per list: its current head
		}
	}
	dummy := &ListNode{}
	tail := dummy
	for h.Len() > 0 {
		node := heap.Pop(h).(*ListNode) // [2] the smallest head overall is the next output value
		tail.Next = node
		tail = node
		if node.Next != nil {
			heap.Push(h, node.Next) // [3] that list's next node becomes its new candidate
		}
	}
	return dummy.Next // [4] skip the dummy
}
