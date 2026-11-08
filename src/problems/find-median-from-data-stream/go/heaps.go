package find_median_from_data_stream

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

// maxHeap reuses minHeap and only flips Less, so the biggest item is on top.
type maxHeap struct{ minHeap }

func (h maxHeap) Less(i, j int) bool { return h.minHeap[i] > h.minHeap[j] }

type MedianFinder struct {
	lower *maxHeap // the smaller half. Its top is the biggest of the small numbers
	upper *minHeap // the bigger half. Its top is the smallest of the big numbers
}

func newMedianFinder() *MedianFinder { // [1] two empty heaps
	return &MedianFinder{lower: &maxHeap{}, upper: &minHeap{}}
}

func (m *MedianFinder) AddNum(num int) {
	heap.Push(m.lower, num)               // [2] the new number enters the lower half first
	heap.Push(m.upper, heap.Pop(m.lower)) // [2] then the lower half's biggest crosses over
	if m.upper.Len() > m.lower.Len() {
		heap.Push(m.lower, heap.Pop(m.upper)) // [3] keep the halves balanced: lower may hold one extra
	}
}

func (m *MedianFinder) FindMedian() float64 {
	if m.lower.Len() > m.upper.Len() {
		return float64(m.lower.minHeap[0]) // [4] odd count: the lower top
	}
	return float64(m.lower.minHeap[0]+(*m.upper)[0]) / 2 // [4] even count: the mean of both tops
}
