package alien_dictionary

import (
	"slices"
	"strings"
)

func alienOrder(words []string) string {
	var letters []byte         // every letter once, in first-seen order
	after := map[byte][]byte{} // letter -> letters that must come after it
	seen := map[byte]bool{}
	for _, w := range words {
		for i := 0; i < len(w); i++ {
			if !seen[w[i]] { // [1] every letter counts, even ones with no rule
				seen[w[i]] = true
				letters = append(letters, w[i])
			}
		}
	}
	for i := 0; i+1 < len(words); i++ {
		a, b := words[i], words[i+1]
		if len(a) > len(b) && strings.HasPrefix(a, b) {
			return "" // [2] "abc" before "ab" cannot be sorted by any alphabet
		}
		for j := 0; j < min(len(a), len(b)); j++ {
			if a[j] != b[j] {
				if !slices.Contains(after[a[j]], b[j]) {
					after[a[j]] = append(after[a[j]], b[j]) // [2] the first different letters give one rule: a[j] comes before b[j]
				}
				break
			}
		}
	}
	indegree := map[byte]int{} // how many rules still point at each letter
	for _, outs := range after {
		for _, ch := range outs {
			indegree[ch]++
		}
	}
	var queue []byte
	for _, ch := range letters {
		if indegree[ch] == 0 { // [3] letters that nothing must come before
			queue = append(queue, ch)
		}
	}
	order := make([]byte, 0, len(letters))
	for head := 0; head < len(queue); head++ {
		ch := queue[head]
		order = append(order, ch) // [4] output it, then remove its rules so its followers may unlock
		for _, nxt := range after[ch] {
			indegree[nxt]--
			if indegree[nxt] == 0 {
				queue = append(queue, nxt)
			}
		}
	}
	if len(order) != len(letters) {
		return "" // [5] a cycle leaves letters stuck, so some never get output
	}
	return string(order)
}
