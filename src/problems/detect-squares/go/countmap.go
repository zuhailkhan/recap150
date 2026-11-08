package detect_squares

type DetectSquares struct {
	copies map[[2]int]int // point -> how many copies of it
	pts    [][2]int       // every point added, repeats included
}

func newDetectSquares() *DetectSquares {
	return &DetectSquares{copies: map[[2]int]int{}}
}

func (d *DetectSquares) Add(point []int) {
	p := [2]int{point[0], point[1]}
	d.copies[p]++            // [1] one more copy of this point
	d.pts = append(d.pts, p) // [1] and remember it as a possible opposite corner
}

func (d *DetectSquares) Count(point []int) int {
	qx, qy := point[0], point[1]
	total := 0
	for _, p := range d.pts { // [2] each stored point could be the opposite corner
		px, py := p[0], p[1]
		if abs(px-qx) != abs(py-qy) || px == qx {
			continue // [2] needs equal, non-zero distance across and up
		}
		a := d.copies[[2]int{qx, py}] // [3] the corner straight above or below the query
		b := d.copies[[2]int{px, qy}] // [3] the corner straight beside the query
		total += a * b                // [3] every pairing of copies is one square
	}
	return total // [4] the sum over all opposite corners
}

func abs(v int) int {
	if v < 0 {
		return -v
	}
	return v
}
