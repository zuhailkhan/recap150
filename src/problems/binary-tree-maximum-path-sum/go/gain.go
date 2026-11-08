package binary_tree_maximum_path_sum

import "math"

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func maxPathSum(root *TreeNode) int {
	best := math.MinInt // [1] the best path found anywhere so far
	var gain func(node *TreeNode) int
	gain = func(node *TreeNode) int {
		if node == nil {
			return 0
		}
		left := max(0, gain(node.Left)) // [2] what each child offers upward, never less than 0
		right := max(0, gain(node.Right))
		best = max(best, node.Val+left+right) // [3] a path may bend here: left side + node + right side
		return node.Val + max(left, right)    // [4] going up, the path may continue through only one child
	}
	gain(root)
	return best // [5]
}
