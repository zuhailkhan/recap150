package word_search

func exist(board [][]byte, word string) bool {
	rows, cols := len(board), len(board[0])
	var dfs func(r, c, k int) bool
	dfs = func(r, c, k int) bool {
		if k == len(word) { // [2] every letter is matched: the word is on the board
			return true
		}
		if r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] != word[k] { // [2] off the board, in use, or the wrong letter: dead end
			return false
		}
		saved := board[r][c]
		// [3] mark this cell as in use, so the path cannot step on it again
		board[r][c] = '#'
		// [3] try the four neighbours, stop at the first success
		found := dfs(r, c+1, k+1) || dfs(r+1, c, k+1) || dfs(r, c-1, k+1) || dfs(r-1, c, k+1)
		// [4] restore the letter so other paths can use this cell
		board[r][c] = saved
		return found
	}
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if dfs(r, c, 0) { // [1] a start cell worked
				return true
			}
		}
	}
	return false // [1] no start cell led to the whole word
}
