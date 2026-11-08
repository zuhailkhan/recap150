package construct_binary_tree_from_preorder_and_inorder_traversal

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func buildTree(preorder, inorder []int) *TreeNode {
	where := make(map[int]int, len(inorder)) // [1] value -> its position in inorder
	for i, v := range inorder {
		where[v] = i
	}
	next := 0 // [1] preorder lists the next root first
	var build func(lo, hi int) *TreeNode
	build = func(lo, hi int) *TreeNode {
		if lo > hi {
			return nil
		}
		val := preorder[next] // [2] the next unused preorder value is the root of this range
		next++
		mid := where[val]
		node := &TreeNode{Val: val}
		node.Left = build(lo, mid-1)  // [3] values left of the root in inorder form the left subtree
		node.Right = build(mid+1, hi) // [4] values right of the root form the right subtree
		return node
	}
	return build(0, len(inorder)-1) // [5] the first call built the root
}
