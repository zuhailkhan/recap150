package invert_binary_tree

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

// treeToSlice is the reverse: level order, nil for missing children, trailing nils trimmed.
func treeToSlice(root *TreeNode) []any {
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

func invertTreeDriver(vals []any) []any {
	return treeToSlice(invertTree(buildTree(vals)))
}
