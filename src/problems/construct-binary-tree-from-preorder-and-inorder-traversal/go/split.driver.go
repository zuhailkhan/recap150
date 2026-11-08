package construct_binary_tree_from_preorder_and_inorder_traversal

// levelOrder writes a tree as a level-order array with nil for missing children, trailing nils trimmed.
func levelOrder(root *TreeNode) []any {
	out := []any{}
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		n := queue[0]
		queue = queue[1:]
		if n == nil {
			out = append(out, nil)
			continue
		}
		out = append(out, n.Val)
		queue = append(queue, n.Left, n.Right)
	}
	for len(out) > 0 && out[len(out)-1] == nil {
		out = out[:len(out)-1]
	}
	return out
}

func buildTreeDriver(preorder, inorder []int) []any {
	return levelOrder(buildTree(preorder, inorder))
}
