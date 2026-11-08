package binary_tree_level_order_traversal

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func levelOrder(root *TreeNode) [][]int {
	result := [][]int{}
	if root == nil { // [1] nothing to visit
		return result
	}
	queue := []*TreeNode{root} // [1] nodes waiting their turn, front first
	for len(queue) > 0 {
		size := len(queue) // [2] freeze the level: this many nodes belong to it
		level := make([]int, 0, size)
		for i := 0; i < size; i++ {
			node := queue[0] // [3] take the front node
			queue = queue[1:]
			level = append(level, node.Val) // [3] record it in this level
			if node.Left != nil {           // [3] its children wait for the next level
				queue = append(queue, node.Left)
			}
			if node.Right != nil {
				queue = append(queue, node.Right)
			}
		}
		result = append(result, level) // [4] the level is complete
	}
	return result
}
