package swim_in_rising_water

import "container/heap"

// cell is one heap entry: the water level needed to stand on (r, c).
type cell struct{ level, r, c int }

// minHeap orders cells by level. Go's container/heap needs these five methods.
type minHeap []cell

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].level < h[j].level }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(cell)) }
func (h *minHeap) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

func swimInWater(grid [][]int) int {
	n := len(grid)
	seen := make([][]bool, n) // seen = in the heap or already popped
	for i := range seen {
		seen[i] = make([]bool, n)
	}
	h := &minHeap{{grid[0][0], 0, 0}} // [1] a path that is only the start costs the start's height
	seen[0][0] = true
	dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	for h.Len() > 0 {
		cur := heap.Pop(h).(cell) // [2] the cell reachable with the lowest water level
		if cur.r == n-1 && cur.c == n-1 {
			return cur.level // [4] first time the goal comes out is the best
		}
		for _, d := range dirs {
			nr, nc := cur.r+d[0], cur.c+d[1]
			if nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc] {
				continue
			}
			seen[nr][nc] = true
			heap.Push(h, cell{max(cur.level, grid[nr][nc]), nr, nc}) // [3] reaching it needs the higher of the old level and its own height
		}
	}
	return -1
}
