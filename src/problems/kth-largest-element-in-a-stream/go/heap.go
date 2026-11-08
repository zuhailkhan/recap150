package kth_largest_element_in_a_stream

import "container/heap"

// minHeap is a min-heap of ints. container/heap needs exactly these five methods:
// Len, Less and Swap from sort.Interface, plus Push and Pop that append and remove the LAST item.
type minHeap []int

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *minHeap) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

type KthLargest struct {
	k int
	h *minHeap // the k biggest numbers so far. The smallest of them is on top
}

func newKthLargest(k int, nums []int) *KthLargest {
	kl := &KthLargest{k: k, h: &minHeap{}}
	for _, x := range nums { // [1] start with the numbers we were given
		kl.Add(x)
	}
	return kl
}

func (kl *KthLargest) Add(val int) int {
	heap.Push(kl.h, val) // [2] every new number goes in first
	if kl.h.Len() > kl.k {
		heap.Pop(kl.h) // [3] one too many: the smallest cannot be the kth largest
	}
	return (*kl.h)[0] // [4] the top is the answer
}
