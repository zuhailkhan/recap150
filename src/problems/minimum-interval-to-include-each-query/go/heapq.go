package minimum_interval_to_include_each_query

import (
	"container/heap"
	"sort"
)

// entry is one candidate interval: its size and where it ends.
type entry struct{ size, end int }

// minHeap orders entries by size. Go's container/heap needs these five methods.
type minHeap []entry

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].size < h[j].size }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(entry)) }
func (h *minHeap) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

func minInterval(intervals [][]int, queries []int) []int {
	sorted := append([][]int(nil), intervals...) // [1] a copy, by start
	sort.Slice(sorted, func(a, b int) bool { return sorted[a][0] < sorted[b][0] })
	order := make([]int, len(queries)) // [1] positions of the queries, smallest query first
	for i := range order {
		order[i] = i
	}
	sort.Slice(order, func(a, b int) bool { return queries[order[a]] < queries[order[b]] })
	answer := make([]int, len(queries))
	h := &minHeap{}
	next := 0
	for _, qi := range order {
		q := queries[qi]
		for next < len(sorted) && sorted[next][0] <= q { // [2] every interval that has started by q is a candidate
			heap.Push(h, entry{sorted[next][1] - sorted[next][0] + 1, sorted[next][1]}) // size counts both ends
			next++
		}
		for h.Len() > 0 && (*h)[0].end < q { // [3] the smallest one ends before q, so it is useless now and for every later query
			heap.Pop(h)
		}
		if h.Len() > 0 { // [4] the top is the smallest interval that still covers q; -1 if none
			answer[qi] = (*h)[0].size
		} else {
			answer[qi] = -1
		}
	}
	return answer // [5]
}
