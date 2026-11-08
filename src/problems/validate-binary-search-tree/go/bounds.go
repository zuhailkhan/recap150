package validate_binary_search_tree

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func isValidBST(root *TreeNode) bool {
	return check(root, nil, nil) // [1] the root may be any value
}

// low and high are nil when that side has no limit.
func check(node *TreeNode, low, high *int) bool {
	if node == nil {
		return true
	}
	if (low != nil && node.Val <= *low) || (high != nil && node.Val >= *high) {
		return false // [2] must sit strictly between the two bounds
	}
	if !check(node.Left, low, &node.Val) {
		return false // [3] left subtree: the upper bound becomes this value
	}
	return check(node.Right, &node.Val, high) // [4] right subtree: the lower bound becomes this value
}
