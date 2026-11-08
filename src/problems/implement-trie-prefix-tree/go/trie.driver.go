package implement_trie_prefix_tree

import "fmt"

// run replays the operations. One result per operation: nil for the constructor and Insert, a bool otherwise.
func run(ops []string, args [][]string) []any {
	var trie *Trie
	out := make([]any, 0, len(ops))
	for i, op := range ops {
		switch op {
		case "Trie":
			trie = newTrie()
			out = append(out, nil)
		case "insert":
			trie.Insert(args[i][0])
			out = append(out, nil)
		case "search":
			out = append(out, trie.Search(args[i][0]))
		case "startsWith":
			out = append(out, trie.StartsWith(args[i][0]))
		default:
			panic(fmt.Sprintf("unknown operation %s", op))
		}
	}
	return out
}
