package binary_tree_right_side_view

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func rightSideView(root *TreeNode) []int {
	view := []int{}
	var level []*TreeNode
	if root != nil {
		level = []*TreeNode{root} // [1] the current row, starting with the root
	}
	for len(level) > 0 {
		var next []*TreeNode
		for _, node := range level { // [2] walk the row left to right
			if node.Left != nil {
				next = append(next, node.Left) // [3] queue the children for the next row
			}
			if node.Right != nil {
				next = append(next, node.Right)
			}
		}
		view = append(view, level[len(level)-1].Val) // [4] the last node in the row is the one you see
		level = next
	}
	return view // [5] one value per row
}
