package word_ladder

func ladderLength(beginWord string, endWord string, wordList []string) int {
	groups := map[string][]string{} // [1] pattern -> words that fit it, like h*t -> hot
	for _, w := range wordList {
		for i := range w {
			pattern := w[:i] + "*" + w[i+1:] // [1] hide one letter
			groups[pattern] = append(groups[pattern], w)
		}
	}

	dist := map[string]int{beginWord: 1} // [2] words reached so far, and the length of the ladder to each
	queue := []string{beginWord}

	for head := 0; head < len(queue); head++ {
		word := queue[head] // [3] take the oldest word and read its patterns
		for i := range word {
			pattern := word[:i] + "*" + word[i+1:] // [3] same patterns as when the buckets were built
			for _, next := range groups[pattern] { // [4] every word in the bucket differs by one letter
				if next == endWord { // [5] found the end word: the ladder is one longer
					return dist[word] + 1
				}
				if _, seen := dist[next]; !seen { // [4] a new word: record its length and queue it
					dist[next] = dist[word] + 1
					queue = append(queue, next)
				}
			}
		}
	}
	return 0 // [5] no more words to explore: unreachable
}
