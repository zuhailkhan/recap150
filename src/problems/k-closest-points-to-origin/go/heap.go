package k_closest_points_to_origin

import "container/heap"

type entry struct {
	d int // squared distance from the origin
	p []int
}

// farHeap is a max-heap by distance. Less says "i belongs above j", so > puts the farthest on top.
// container/heap needs five methods: Len, Less, Swap, and Push and Pop that work on the LAST slice item.
type farHeap []entry

func (h farHeap) Len() int           { return len(h) }
func (h farHeap) Less(i, j int) bool { return h[i].d > h[j].d }
func (h farHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *farHeap) Push(x any)        { *h = append(*h, x.(entry)) }
func (h *farHeap) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

func kClosest(points [][]int, k int) [][]int {
	h := &farHeap{}
	for _, p := range points {
		d := p[0]*p[0] + p[1]*p[1]      // [1] squared distance. No sqrt needed to compare
		heap.Push(h, entry{d: d, p: p}) // [2] keep it for now
		if h.Len() > k {
			heap.Pop(h) // [3] more than k: the farthest point cannot be in the answer
		}
	}
	out := make([][]int, 0, h.Len())
	for _, e := range *h { // [4] the heap holds exactly the k closest
		out = append(out, e.p)
	}
	return out
}
