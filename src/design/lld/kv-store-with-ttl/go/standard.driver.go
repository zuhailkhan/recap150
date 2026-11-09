package lld_kv_store_with_ttl

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var st *TtlStore
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "TtlStore":
			st = NewTtlStore(int(a[0].(float64)), &LruPolicy{})
			out = append(out, nil)
		case "put":
			var ttl *int
			if a[3] != nil {
				n := int(a[3].(float64))
				ttl = &n
			}
			out = append(out, st.Put(a[0].(string), a[1].(string), int(a[2].(float64)), ttl))
		case "get":
			if v, ok := st.Get(a[0].(string), int(a[1].(float64))); ok {
				out = append(out, v)
			} else {
				out = append(out, nil)
			}
		case "delete":
			out = append(out, b2i(st.Delete(a[0].(string))))
		case "sweep":
			out = append(out, st.Sweep(int(a[0].(float64))))
		case "size":
			out = append(out, len(st.entries))
		}
	}
	return out
}

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}
