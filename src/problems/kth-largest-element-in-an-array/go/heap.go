package kth_largest_element_in_an_array

import "container/heap"

// minHeap is a min-heap of ints. container/heap needs five methods: Len, Less, Swap,
// and Push and Pop that work on the LAST slice item.
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

func findKthLargest(nums []int, k int) int {
	h := &minHeap{} // [1] min-heap: the smallest kept number is on top
	for _, x := range nums {
		heap.Push(h, x) // [2] every number goes in first
		if h.Len() > k {
			heap.Pop(h) // [3] one too many: the smallest cannot be the kth largest
		}
	}
	return (*h)[0] // [4] the top is the kth largest
}
