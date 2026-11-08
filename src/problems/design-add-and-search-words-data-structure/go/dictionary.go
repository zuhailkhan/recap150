package design_add_and_search_words_data_structure

type node struct {
	children map[rune]*node // letter -> child
	end      bool           // a stored word finishes at this node
}

func newNode() *node {
	return &node{children: map[rune]*node{}} // a nil map would panic on the first write
}

type WordDictionary struct {
	root *node
}

func newWordDictionary() *WordDictionary {
	return &WordDictionary{root: newNode()} // [1] an empty node stands for the empty prefix
}

func (d *WordDictionary) AddWord(word string) {
	cur := d.root
	for _, ch := range word {
		if cur.children[ch] == nil { // [2] reuse shared prefixes, create the rest
			cur.children[ch] = newNode()
		}
		cur = cur.children[ch]
	}
	cur.end = true // [2] mark where the word finishes
}

func (d *WordDictionary) Search(word string) bool {
	letters := []rune(word)
	var dfs func(cur *node, i int) bool
	dfs = func(cur *node, i int) bool {
		if i == len(letters) {
			return cur.end // [5] the whole pattern is used: the node must end a word
		}
		if letters[i] == '.' {
			for _, child := range cur.children {
				if dfs(child, i+1) { // [4] a wildcard branches into every child
					return true
				}
			}
			return false
		}
		child := cur.children[letters[i]] // [3] a plain letter has exactly one way to go
		return child != nil && dfs(child, i+1)
	}
	return dfs(d.root, 0)
}
