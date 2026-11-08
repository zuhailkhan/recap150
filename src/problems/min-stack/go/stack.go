package min_stack

type MinStack struct {
	vals []int // [1] the normal stack of values
	mins []int // [1] mins[i] is the smallest value in vals[0..i]
}

func NewMinStack() MinStack {
	return MinStack{}
}

func (s *MinStack) Push(val int) {
	low := val
	if len(s.mins) > 0 && s.mins[len(s.mins)-1] < val {
		low = s.mins[len(s.mins)-1]
	}
	s.vals = append(s.vals, val) // [2] store the value
	s.mins = append(s.mins, low) // [2] and the smallest value so far
}

func (s *MinStack) Pop() {
	s.vals = s.vals[:len(s.vals)-1] // [3] both stacks shrink together
	s.mins = s.mins[:len(s.mins)-1]
}

func (s *MinStack) Top() int {
	return s.vals[len(s.vals)-1] // [4] newest value
}

func (s *MinStack) GetMin() int {
	return s.mins[len(s.mins)-1] // [5] the answer is already stored on top
}
