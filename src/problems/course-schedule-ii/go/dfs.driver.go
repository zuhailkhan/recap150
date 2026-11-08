package course_schedule_ii

// findOrderDriver returns [length, valid]. See the TypeScript driver for the meaning.
func findOrderDriver(numCourses int, prerequisites [][]int) []int {
	order := findOrder(numCourses, prerequisites)
	if len(order) == 0 {
		return []int{0, 1}
	}
	at := map[int]int{}
	for i, c := range order {
		if c < 0 || c >= numCourses {
			return []int{len(order), 0}
		}
		at[c] = i
	}
	valid := len(order) == numCourses && len(at) == numCourses
	for _, p := range prerequisites {
		a, okA := at[p[0]]
		b, okB := at[p[1]]
		if !okA || !okB || b >= a {
			valid = false
		}
	}
	if valid {
		return []int{len(order), 1}
	}
	return []int{len(order), 0}
}
