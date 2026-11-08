package kth_smallest_element_in_a_bst

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func kthSmallest(root *TreeNode, k int) int {
	var stack []*TreeNode
	cur := root // [1] cur is where we are, the stack holds the nodes we still owe a visit
	count := 0
	for cur != nil || len(stack) > 0 {
		for cur != nil { // [2] dive left, leaving a trail of nodes to come back to
			stack = append(stack, cur)
			cur = cur.Left
		}
		node := stack[len(stack)-1] // [3] nothing smaller is left, so this is the next smallest
		stack = stack[:len(stack)-1]
		count++
		if count == k {
			return node.Val // [4] the count reached k
		}
		cur = node.Right // [5] then everything in this node's right subtree
	}
	return -1
}
