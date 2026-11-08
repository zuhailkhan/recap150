package time_based_key_value_store

type entry struct {
	ts  int
	val string
}

type TimeMap struct {
	store map[string][]entry // [1] every key owns a list of (timestamp, value)
}

func Constructor() TimeMap {
	return TimeMap{store: map[string][]entry{}} // [1]
}

func (tm *TimeMap) Set(key string, value string, timestamp int) {
	// [2] timestamps only grow, so the list stays sorted
	tm.store[key] = append(tm.store[key], entry{timestamp, value})
}

func (tm *TimeMap) Get(key string, timestamp int) string {
	list := tm.store[key] // a missing key gives a nil slice, which is fine
	l := 0                // [3] binary search the list for the latest timestamp <= the query
	r := len(list) - 1    // [3]
	best := ""            // [3] "" means no value at or before this time
	for l <= r {
		m := l + (r-l)/2
		if list[m].ts <= timestamp { // [4] not newer than the query: a candidate. Look right for a newer one
			best = list[m].val
			l = m + 1
		} else {
			r = m - 1 // [4] newer than the query: too late. Look left
		}
	}
	return best // [5] the last candidate we kept, or "" if none
}
