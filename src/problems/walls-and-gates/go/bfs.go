package walls_and_gates

const inf = 2147483647 // an empty room no gate has reached yet

var dirs = [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

// wallsAndGates: -1 = wall, 0 = gate, inf = empty room.
// It returns a grid where each room holds its distance to the nearest gate.
func wallsAndGates(rooms [][]int) [][]int {
	out := make([][]int, len(rooms)) // copy so the input stays as it was
	var queue [][2]int
	for r := range rooms {
		out[r] = append([]int(nil), rooms[r]...)
		for c, v := range out[r] {
			if v == 0 {
				queue = append(queue, [2]int{r, c}) // [1] every gate starts the spread at distance 0
			}
		}
	}

	d := 0
	for len(queue) > 0 {
		d++
		var next [][2]int
		for _, cur := range queue {
			for _, dir := range dirs {
				nr, nc := cur[0]+dir[0], cur[1]+dir[1]
				if nr < 0 || nr >= len(out) || nc < 0 || nc >= len(out[nr]) {
					continue // off the grid
				}
				if out[nr][nc] != inf {
					continue // [2] a wall, a gate, or a room that a closer gate already reached
				}
				out[nr][nc] = d // [2] first visit is the shortest distance, because waves go outward one step at a time
				next = append(next, [2]int{nr, nc})
			}
		}
		queue = next
	}
	return out // [3] unreachable rooms keep inf
}
