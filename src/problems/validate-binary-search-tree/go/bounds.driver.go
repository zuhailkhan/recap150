package validate_binary_search_tree

// buildTree reads a level-order array where nil means "no child".
func buildTree(vals []any) *TreeNode {
	if len(vals) == 0 || vals[0] == nil {
		return nil
	}
	mk := func(v any) *TreeNode {
		if v == nil {
			return nil
		}
		return &TreeNode{Val: int(v.(float64))}
	}
	root := mk(vals[0])
	queue := []*TreeNode{root}
	for i := 1; len(queue) > 0 && i < len(vals); {
		cur := queue[0]
		queue = queue[1:]
		if cur.Left = mk(vals[i]); cur.Left != nil {
			queue = append(queue, cur.Left)
		}
		i++
		if i < len(vals) {
			if cur.Right = mk(vals[i]); cur.Right != nil {
				queue = append(queue, cur.Right)
			}
			i++
		}
	}
	return root
}

func isValidBSTDriver(vals []any) bool {
	return isValidBST(buildTree(vals))
}
