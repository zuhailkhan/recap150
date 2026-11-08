package balanced_binary_tree

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func isBalanced(root *TreeNode) bool {
	balanced := true // [1] stays true until some node is lopsided
	var height func(node *TreeNode) int
	height = func(node *TreeNode) int {
		if node == nil { // [2] an empty spot is 0 tall
			return 0
		}
		left := height(node.Left)             // [3] height of the left side
		right := height(node.Right)           // [3] height of the right side
		if left-right > 1 || right-left > 1 { // [4] the sides differ by 2 or more
			balanced = false
		}
		return 1 + max(left, right) // [5] report my height to the parent
	}
	height(root)
	return balanced // [5]
}
