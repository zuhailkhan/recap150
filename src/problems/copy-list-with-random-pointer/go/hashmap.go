package copy_list_with_random_pointer

type Node struct {
	Val    int
	Next   *Node
	Random *Node
}

func copyRandomList(head *Node) *Node {
	copies := make(map[*Node]*Node)
	twin := func(n *Node) *Node { return copies[n] } // [2] new twin of an old node. A missing key (nil) gives nil
	for n := head; n != nil; n = n.Next {
		copies[n] = &Node{Val: n.Val} // [1] one new node per old node, remembered in the map
	}
	for n := head; n != nil; n = n.Next {
		twin(n).Next = twin(n.Next) // [2] the twin's next is the twin of the old next
	}
	for n := head; n != nil; n = n.Next {
		twin(n).Random = twin(n.Random) // [3] same trick for random: look the target up in the map
	}
	return twin(head) // [4] the copy's head
}
