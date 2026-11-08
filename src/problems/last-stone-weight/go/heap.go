package last_stone_weight

import "container/heap"

// maxHeap is a max-heap of ints. Less says "i belongs above j", so > puts the biggest on top.
// container/heap needs five methods: Len, Less, Swap, and Push and Pop that work on the LAST slice item.
type maxHeap []int

func (h maxHeap) Len() int           { return len(h) }
func (h maxHeap) Less(i, j int) bool { return h[i] > h[j] }
func (h maxHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *maxHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *maxHeap) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

func lastStoneWeight(stones []int) int {
	h := &maxHeap{}
	for _, s := range stones {
		heap.Push(h, s) // [1] put every stone in the heap
	}
	for h.Len() > 1 {
		y := heap.Pop(h).(int) // [2] the two heaviest stones
		x := heap.Pop(h).(int)
		if y > x {
			heap.Push(h, y-x) // [3] the heavier one survives with what is left over
		}
	}
	if h.Len() == 0 {
		return 0 // [4] zero or one stone remains
	}
	return (*h)[0]
}
