package word_search_ii

type node struct {
	next [26]*node // one slot per lowercase letter. A nil slot means no child
	end  bool      // a word finishes here and has not been reported yet
}

func findWords(board [][]string, words []string) []string {
	root := &node{}
	for _, w := range words {
		cur := root
		for i := 0; i < len(w); i++ {
			k := w[i] - 'a'
			if cur.next[k] == nil { // [1] build one trie from all the words
				cur.next[k] = &node{}
			}
			cur = cur.next[k]
		}
		cur.end = true
	}

	found := []string{}                // not nil, so an empty answer is [] and not null
	seen := make([][]bool, len(board)) // cells on the current path
	for r := range seen {
		seen[r] = make([]bool, len(board[r]))
	}
	var dfs func(r, c int, cur *node, path string)
	dfs = func(r, c int, cur *node, path string) {
		next := cur.next[board[r][c][0]-'a']
		if next == nil {
			return // [3] prune: no word in the list starts with path + this letter
		}
		path += board[r][c]
		seen[r][c] = true // [2] this cell is on the path, so it cannot be used twice
		if next.end {
			found = append(found, path) // [4] a whole word is spelled by the path
			next.end = false            // report each word once
		}
		for _, d := range [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}} {
			nr, nc := r+d[0], c+d[1]
			if nr >= 0 && nr < len(board) && nc >= 0 && nc < len(board[nr]) && !seen[nr][nc] {
				dfs(nr, nc, next, path)
			}
		}
		seen[r][c] = false // [5] backtrack: free the cell for other paths
	}
	for r := range board {
		for c := range board[r] {
			dfs(r, c, root, "")
		}
	}
	return found
}
