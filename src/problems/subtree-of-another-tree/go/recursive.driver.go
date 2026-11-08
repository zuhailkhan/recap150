package subtree_of_another_tree

// buildTree turns a level-order array (nil = missing child) into nodes.
func buildTree(vals []any) *TreeNode {
	if len(vals) == 0 || vals[0] == nil {
		return nil
	}
	root := &TreeNode{Val: int(vals[0].(float64))}
	queue := []*TreeNode{root}
	for i := 1; len(queue) > 0 && i < len(vals); {
		n := queue[0]
		queue = queue[1:]
		if i < len(vals) && vals[i] != nil {
			n.Left = &TreeNode{Val: int(vals[i].(float64))}
			queue = append(queue, n.Left)
		}
		i++
		if i < len(vals) && vals[i] != nil {
			n.Right = &TreeNode{Val: int(vals[i].(float64))}
			queue = append(queue, n.Right)
		}
		i++
	}
	return root
}

func isSubtreeDriver(root, sub []any) bool {
	return isSubtree(buildTree(root), buildTree(sub))
}
