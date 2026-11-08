package subtree_of_another_tree

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func isSubtree(root, subRoot *TreeNode) bool {
	if subRoot == nil { // [1] an empty tree fits inside any tree
		return true
	}
	if root == nil { // [1] ran out of tree without a match
		return false
	}
	if sameTree(root, subRoot) { // [2] does the copy start exactly here?
		return true
	}
	return isSubtree(root.Left, subRoot) || isSubtree(root.Right, subRoot) // [3] try the children as new starting points
}

// [2] same check as Same Tree: shape and values must match all the way down
func sameTree(a, b *TreeNode) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return a.Val == b.Val && sameTree(a.Left, b.Left) && sameTree(a.Right, b.Right)
}
