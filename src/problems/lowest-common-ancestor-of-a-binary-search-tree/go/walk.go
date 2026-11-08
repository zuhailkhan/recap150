package lowest_common_ancestor_of_a_binary_search_tree

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func lowestCommonAncestor(root *TreeNode, p, q int) *TreeNode {
	node := root // [1] start at the top
	for node != nil {
		if p < node.Val && q < node.Val { // [2] both are smaller, so both live on the left
			node = node.Left
		} else if p > node.Val && q > node.Val { // [3] both are bigger, so both live on the right
			node = node.Right
		} else { // [4] the paths split here, or this node is one of them
			return node
		}
	}
	return nil
}
