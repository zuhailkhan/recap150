package lru_cache

type entry struct {
	key, val   int
	prev, next *entry
}

type LRUCache struct {
	capacity   int
	items      map[int]*entry // key -> its node, so a lookup is one step
	head, tail *entry         // dummies. head.next is the most recent, tail.prev the least
}

func newLRUCache(capacity int) *LRUCache {
	c := &LRUCache{capacity: capacity, items: map[int]*entry{}, head: &entry{}, tail: &entry{}}
	c.head.next = c.tail // [1] the dummies link to each other, so no node ever needs a nil check
	c.tail.prev = c.head
	return c
}

func (c *LRUCache) Get(key int) int {
	node, ok := c.items[key] // [2] the map finds the node without walking the list
	if !ok {
		return -1
	}
	c.moveToFront(node) // [3] reading counts as use
	return node.val
}

func (c *LRUCache) Put(key, value int) {
	if node, ok := c.items[key]; ok { // [2] is this key already stored?
		node.val = value
		c.moveToFront(node) // [3] updating counts as use too
		return
	}
	node := &entry{key: key, val: value}
	c.items[key] = node // [4] new key: add to the map and link at the front
	c.insertFront(node)
	if len(c.items) > c.capacity {
		lru := c.tail.prev // [5] the least recently used node sits right before the tail
		c.unlink(lru)
		delete(c.items, lru.key) // [5] remove it from the list AND the map
	}
}

func (c *LRUCache) unlink(node *entry) {
	node.prev.next = node.next // [3] bypass the node: two pointer changes
	node.next.prev = node.prev
}

func (c *LRUCache) insertFront(node *entry) {
	node.prev = c.head // [3] link right after the dummy head: four pointer changes
	node.next = c.head.next
	c.head.next.prev = node
	c.head.next = node
}

func (c *LRUCache) moveToFront(node *entry) {
	c.unlink(node)
	c.insertFront(node)
}
