package count_good_nodes_in_binary_tree

import "math"

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func goodNodes(root *TreeNode) int {
	return countGood(root, math.MinInt) // [1] nothing above the root, so the root is always good
}

func countGood(node *TreeNode, highest int) int {
	if node == nil {
		return 0
	}
	good := 0
	if node.Val >= highest {
		good = 1 // [2] good when nothing above it is bigger
	}
	best := highest
	if node.Val > best {
		best = node.Val // [3] the bar the children must reach
	}
	return good + countGood(node.Left, best) + countGood(node.Right, best) // [4] add up this subtree
}
