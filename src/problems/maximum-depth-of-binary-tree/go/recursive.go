package maximum_depth_of_binary_tree

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func maxDepth(root *TreeNode) int {
	if root == nil { // [1] an empty spot is 0 levels deep
		return 0
	}
	left := maxDepth(root.Left)   // [2] depth of the left side
	right := maxDepth(root.Right) // [2] depth of the right side
	depth := 1 + max(left, right) // [3] this node adds one level on top of the deeper side
	return depth                  // [3]
}
