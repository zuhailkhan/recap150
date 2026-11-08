package design_add_and_search_words_data_structure

import "fmt"

// run replays the operations. One result per operation: nil for the constructor and AddWord, a bool for Search.
func run(ops []string, args [][]string) []any {
	var dict *WordDictionary
	out := make([]any, 0, len(ops))
	for i, op := range ops {
		switch op {
		case "WordDictionary":
			dict = newWordDictionary()
			out = append(out, nil)
		case "addWord":
			dict.AddWord(args[i][0])
			out = append(out, nil)
		case "search":
			out = append(out, dict.Search(args[i][0]))
		default:
			panic(fmt.Sprintf("unknown operation %s", op))
		}
	}
	return out
}
