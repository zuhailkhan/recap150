package diameter_of_binary_tree

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func diameterOfBinaryTree(root *TreeNode) int {
	best := 0 // [1] longest path found so far, counted in edges
	var height func(node *TreeNode) int
	height = func(node *TreeNode) int {
		if node == nil { // [2] an empty spot is 0 tall
			return 0
		}
		left := height(node.Left)   // [3] height of the left side
		right := height(node.Right) // [3] height of the right side
		through := left + right     // [4] the longest path that bends at this node
		best = max(best, through)   // [4] keep the larger
		return 1 + max(left, right) // [5] report my height to the parent
	}
	height(root)
	return best // [5]
}
