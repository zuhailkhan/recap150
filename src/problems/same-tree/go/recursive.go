package same_tree

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func isSameTree(p, q *TreeNode) bool {
	if p == nil && q == nil { // [1] both are empty here: they match
		return true
	}
	if p == nil || q == nil { // [2] only one has a node: different shapes
		return false
	}
	if p.Val != q.Val { // [2] same spot, different values
		return false
	}
	return isSameTree(p.Left, q.Left) && isSameTree(p.Right, q.Right) // [3] both sides must match
}
