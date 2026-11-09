package lld_kv_store_with_ttl

import (
	"math"
	"slices"
	"sort"
)

// Never is the expiry of an entry that has no TTL.
const Never = math.MaxInt

// Entry is what the store keeps. ExpiresAt is an integer second, or Never.
type Entry struct {
	Value     string
	ExpiresAt int
}

// EvictionPolicy decides who leaves when the store is full. The store only tells it what happened.
type EvictionPolicy interface {
	Touch(key string)       // the key was just written or read
	Remove(key string)      // the key left the store for any reason
	Victim() (string, bool) // the key to evict next, if any
}

// LruPolicy is least recently used: order[0] was used longest ago.
type LruPolicy struct{ order []string }

func (l *LruPolicy) Touch(key string) {
	l.Remove(key)
	l.order = append(l.order, key) // most recent goes last
}

func (l *LruPolicy) Remove(key string) {
	if i := slices.Index(l.order, key); i >= 0 {
		l.order = slices.Delete(l.order, i, i+1)
	}
}

func (l *LruPolicy) Victim() (string, bool) {
	if len(l.order) == 0 {
		return "", false
	}
	return l.order[0], true
}

// TtlStore takes time as an integer second from the caller, so there is no clock to fake.
// An entry is alive while now < ExpiresAt, so at exactly ExpiresAt it is already gone.
type TtlStore struct {
	entries map[string]Entry
	cap     int // 0 means no limit
	policy  EvictionPolicy
}

func NewTtlStore(capacity int, policy EvictionPolicy) *TtlStore {
	return &TtlStore{entries: map[string]Entry{}, cap: capacity, policy: policy}
}

// Put takes ttl in seconds, nil for never. A ttl of 0 or less means already expired.
// It returns the keys evicted to make room.
func (s *TtlStore) Put(key, value string, now int, ttl *int) []string {
	evicted := []string{}
	if ttl != nil && *ttl <= 0 {
		s.drop(key) // [1] an overwrite that is born expired still replaces the old value
		return evicted
	}
	if _, ok := s.entries[key]; !ok && s.cap > 0 && len(s.entries) >= s.cap {
		s.Sweep(now) // [4] dead entries leave before any live one is evicted
		for len(s.entries) >= s.cap {
			k, ok := s.policy.Victim() // [4] then the policy picks who goes
			if !ok {
				break
			}
			s.drop(k)
			evicted = append(evicted, k)
		}
	}
	expires := Never
	if ttl != nil {
		expires = now + *ttl
	}
	s.entries[key] = Entry{Value: value, ExpiresAt: expires} // [1] a new write always resets the clock
	s.policy.Touch(key)
	return evicted
}

func (s *TtlStore) Get(key string, now int) (string, bool) {
	e, ok := s.entries[key]
	if !ok {
		return "", false
	}
	if now >= e.ExpiresAt {
		s.drop(key) // [3] lazy expiry: found dead on read, removed now
		return "", false
	}
	s.policy.Touch(key) // [2] a read counts as use, but never extends the TTL
	return e.Value, true
}

func (s *TtlStore) Delete(key string) bool {
	return s.drop(key) // [3] same removal path as expiry
}

// Sweep removes every expired entry and returns their keys, sorted. Live entries are never touched.
func (s *TtlStore) Sweep(now int) []string {
	dead := []string{}
	for k, e := range s.entries { // [5] one pass over everything
		if now >= e.ExpiresAt {
			dead = append(dead, k)
		}
	}
	sort.Strings(dead) // map order is random, so sort before anyone sees it
	for _, k := range dead {
		s.drop(k)
	}
	return dead
}

func (s *TtlStore) drop(key string) bool {
	s.policy.Remove(key)
	_, ok := s.entries[key]
	delete(s.entries, key)
	return ok
}
