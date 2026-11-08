package merge_k_sorted_lists

func mergeKListsDriver(lists [][]int) []int {
	heads := make([]*ListNode, len(lists))
	for i, vals := range lists {
		for j := len(vals) - 1; j >= 0; j-- {
			heads[i] = &ListNode{Val: vals[j], Next: heads[i]}
		}
	}
	out := []int{}
	for n := mergeKLists(heads); n != nil; n = n.Next {
		out = append(out, n.Val)
	}
	return out
}
