package implement_trie_prefix_tree

type node struct {
	children map[rune]*node // letter -> child
	end      bool           // a stored word finishes at this node
}

func newNode() *node {
	return &node{children: map[rune]*node{}} // a nil map would panic on the first write
}

type Trie struct {
	root *node
}

func newTrie() *Trie {
	return &Trie{root: newNode()} // [1] an empty node stands for the empty prefix
}

func (t *Trie) Insert(word string) {
	cur := t.root
	for _, ch := range word {
		child, ok := cur.children[ch]
		if !ok { // [2] reuse the child if the prefix is shared, else make one
			child = newNode()
			cur.children[ch] = child
		}
		cur = child
	}
	cur.end = true // [3] only the last node of the word is marked
}

// walk follows the letters of s from the root. It returns nil when a letter has no child.
func (t *Trie) walk(s string) *node {
	cur := t.root
	for _, ch := range s {
		child, ok := cur.children[ch] // [4] follow one letter at a time
		if !ok {
			return nil
		}
		cur = child
	}
	return cur
}

func (t *Trie) Search(word string) bool {
	n := t.walk(word)
	return n != nil && n.end // [5] a full path is not enough: the word must end here
}

func (t *Trie) StartsWith(prefix string) bool {
	return t.walk(prefix) != nil // [5] reaching the end of the walk is enough
}
