package course_schedule_ii

func findOrder(numCourses int, prerequisites [][]int) []int {
	needs := make([][]int, numCourses) // [1] needs[c] = courses to finish before c
	for _, p := range prerequisites {
		needs[p[0]] = append(needs[p[0]], p[1])
	}

	state := make([]int, numCourses) // 0 = unseen, 1 = on the current path, 2 = written down
	order := []int{}

	var visit func(c int) bool
	visit = func(c int) bool {
		if state[c] == 2 { // [4] already written down: nothing to do
			return true
		}
		if state[c] == 1 { // [4] reached a course that is still on the path: a cycle
			return false
		}
		state[c] = 1 // [2] enter c: it is on the current path
		for _, p := range needs[c] {
			if !visit(p) {
				return false
			}
		}
		state[c] = 2 // [3] everything c needs is written: write c
		order = append(order, c)
		return true
	}

	for c := 0; c < numCourses; c++ {
		if !visit(c) {
			return []int{} // [5] start from every course, give up on a cycle
		}
	}
	return order // [5]
}
