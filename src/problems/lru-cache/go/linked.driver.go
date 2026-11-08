package lru_cache

import "fmt"

// run replays the operations. One result per operation: nil for the constructor and Put, a number for Get.
func run(ops []string, args [][]int) []any {
	var cache *LRUCache
	out := make([]any, 0, len(ops))
	for i, op := range ops {
		a := args[i]
		switch op {
		case "LRUCache":
			cache = newLRUCache(a[0])
			out = append(out, nil)
		case "get":
			out = append(out, cache.Get(a[0]))
		case "put":
			cache.Put(a[0], a[1])
			out = append(out, nil)
		default:
			panic(fmt.Sprintf("unknown operation %s", op))
		}
	}
	return out
}
