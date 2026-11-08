package task_scheduler

import "container/heap"

type slot struct {
	task string
	left int // how many copies still have to run
}

type rest struct {
	s    *slot
	back int // the first time unit it may run again
}

// readyHeap is a max-heap by copies left. Less says "i belongs above j", so > puts the busiest on top.
// container/heap needs five methods: Len, Less, Swap, and Push and Pop that work on the LAST slice item.
type readyHeap []*slot

func (h readyHeap) Len() int           { return len(h) }
func (h readyHeap) Less(i, j int) bool { return h[i].left > h[j].left }
func (h readyHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *readyHeap) Push(x any)        { *h = append(*h, x.(*slot)) }
func (h *readyHeap) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

func leastInterval(tasks []string, n int) int {
	counts := map[string]int{}
	for _, task := range tasks {
		counts[task]++ // [1] how many times each task must run
	}
	ready := &readyHeap{}
	for task, left := range counts {
		heap.Push(ready, &slot{task, left})
	}
	var cooling []rest // tasks that are resting, in the order they come back
	time := 0
	for ready.Len() > 0 || len(cooling) > 0 {
		time++
		for len(cooling) > 0 && cooling[0].back <= time {
			heap.Push(ready, cooling[0].s) // [2] a rested task may run again
			cooling = cooling[1:]
		}
		if ready.Len() > 0 {
			s := heap.Pop(ready).(*slot) // [3] run the task with the most copies left. With none ready, this unit is idle
			s.left--
			if s.left > 0 {
				cooling = append(cooling, rest{s, time + n + 1}) // [4] it must rest n time units before it may run again
			}
		}
	}
	return time // [5] the number of time units used, idle ones included
}
