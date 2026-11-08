package serialize_and_deserialize_binary_tree

import (
	"strconv"
	"strings"
)

type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

// Format: preorder, comma separated, "#" for a missing child. Example: "1,2,#,#,3,4,#,#,#"
func serialize(root *TreeNode) string {
	var out []string
	var walk func(node *TreeNode)
	walk = func(node *TreeNode) {
		if node == nil {
			out = append(out, "#") // [1] a marker for "no child here"
			return
		}
		out = append(out, strconv.Itoa(node.Val)) // [2] write the node, then its left side, then its right side
		walk(node.Left)
		walk(node.Right)
	}
	walk(root)
	return strings.Join(out, ",") // [3] one string
}

func deserialize(data string) *TreeNode {
	tokens := strings.Split(data, ",") // [4] back to tokens
	next := 0
	var read func() *TreeNode
	read = func() *TreeNode {
		token := tokens[next] // [5] take the next token. # means no node, otherwise make a node, then read its left, then its right
		next++
		if token == "#" {
			return nil
		}
		val, _ := strconv.Atoi(token)
		node := &TreeNode{Val: val}
		node.Left = read()
		node.Right = read()
		return node
	}
	return read()
}
