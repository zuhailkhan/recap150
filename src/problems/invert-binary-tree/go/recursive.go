package invert_binary_tree

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func invertTree(root *TreeNode) *TreeNode {
	if root == nil { // [1] nothing here, nothing to flip
		return nil
	}
	left := invertTree(root.Right)      // [2] the flipped right side becomes the new left
	right := invertTree(root.Left)      // [2] the flipped left side becomes the new right
	root.Left, root.Right = left, right // [3] swap: both sides are already flipped
	return root                         // [3] hand the finished subtree back to the parent
}
