package course_schedule

func canFinish(numCourses int, prerequisites [][]int) bool {
	next := make([][]int, numCourses) // [1] next[a] = courses that a unlocks
	indeg := make([]int, numCourses)  // [1] prerequisites each course still waits for
	for _, p := range prerequisites {
		course, pre := p[0], p[1]
		next[pre] = append(next[pre], course) // [1] arrow: pre -> course
		indeg[course]++
	}

	queue := []int{}
	for c, d := range indeg {
		if d == 0 {
			queue = append(queue, c) // [2] nothing blocks these
		}
	}

	for head := 0; head < len(queue); head++ {
		c := queue[head] // [3] take a ready course: it is done
		for _, x := range next[c] {
			indeg[x]-- // [4] c is done, so x waits for one less course
			if indeg[x] == 0 {
				queue = append(queue, x) // [4] x is now free: queue it
			}
		}
	}
	return len(queue) == numCourses // [5] every course was queued once: no cycle
}
