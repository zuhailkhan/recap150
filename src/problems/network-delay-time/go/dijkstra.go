package network_delay_time

import (
	"container/heap"
	"math"
)

// item is one heap entry: a node and the time we reached it.
type item struct{ dist, node int }

// minHeap orders items by dist. Go's container/heap needs these five methods.
type minHeap []item

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].dist < h[j].dist }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(item)) }
func (h *minHeap) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

func networkDelayTime(times [][]int, n int, k int) int {
	adj := make([][][2]int, n+1)
	for _, e := range times {
		adj[e[0]] = append(adj[e[0]], [2]int{e[1], e[2]})
	}
	dist := make([]int, n+1) // best known time to reach each node
	for i := range dist {
		dist[i] = math.MaxInt
	}
	dist[k] = 0
	h := &minHeap{{0, k}} // [1] start from the source at time 0
	for h.Len() > 0 {
		cur := heap.Pop(h).(item) // [2] the closest node we have not finished
		if cur.dist > dist[cur.node] {
			continue // stale entry: a shorter way was found after this one was pushed
		}
		for _, e := range adj[cur.node] {
			v, w := e[0], e[1]
			if cur.dist+w < dist[v] { // [3] going through this node beats what we knew about v
				dist[v] = cur.dist + w
				heap.Push(h, item{dist[v], v})
			}
		}
	}
	worst := 0 // [4] the network is done when the slowest node hears it
	for i := 1; i <= n; i++ {
		worst = max(worst, dist[i])
	}
	if worst == math.MaxInt {
		return -1
	}
	return worst
}
