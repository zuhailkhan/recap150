package lld_pub_sub_broker

// Message is one entry in a topic's log. The offset is its position, and it never changes.
type Message struct {
	Offset int
	Value  string
}

// Log is an append-only list of messages. Reading never removes anything.
type Log interface {
	Append(value string) int // returns the new message's offset
	Read(from, max int) []Message
	Size() int
}

type MemoryLog struct{ msgs []Message }

func (l *MemoryLog) Append(value string) int {
	offset := len(l.msgs)
	l.msgs = append(l.msgs, Message{Offset: offset, Value: value})
	return offset
}

func (l *MemoryLog) Read(from, max int) []Message {
	end := min(from+max, len(l.msgs))
	if max <= 0 || from >= end {
		return []Message{}
	}
	return append([]Message{}, l.msgs[from:end]...)
}

func (l *MemoryLog) Size() int { return len(l.msgs) }

type groupTopic struct{ group, topic string }

// Offsets holds, for each (group, topic), the offset of the next message the group has not finished. Starts at 0.
type Offsets struct{ next map[groupTopic]int }

func NewOffsets() *Offsets { return &Offsets{next: map[groupTopic]int{}} }

func (o *Offsets) Get(group, topic string) int { return o.next[groupTopic{group, topic}] }

func (o *Offsets) Set(group, topic string, offset int) { o.next[groupTopic{group, topic}] = offset }

type Broker struct {
	logs    map[string]Log
	offsets *Offsets
}

func NewBroker(logs map[string]Log, offsets *Offsets) *Broker {
	return &Broker{logs: logs, offsets: offsets}
}

// Publish returns the offset the message got, or -1 for an unknown topic.
func (b *Broker) Publish(topic, value string) int {
	log, ok := b.logs[topic]
	if !ok {
		return -1
	}
	return log.Append(value) // [1] the log only ever grows at the end
}

// Poll returns up to max messages from the group's committed offset. It does not move the offset. ok is false for an unknown topic.
func (b *Broker) Poll(group, topic string, max int) (msgs []Message, ok bool) {
	log, ok := b.logs[topic]
	if !ok {
		return nil, false
	}
	from := b.offsets.Get(group, topic) // [2] each group has its own place in the log
	return log.Read(from, max), true    // [3] the same read repeats until the group commits
}

// Commit takes the next message to read, so "done with 0 and 1" is Commit(2). It returns that offset, or -1 if refused.
func (b *Broker) Commit(group, topic string, offset int) int {
	log, ok := b.logs[topic]
	if !ok {
		return -1
	}
	if offset < b.offsets.Get(group, topic) || offset > log.Size() { // [4] never backwards, never past the end
		return -1
	}
	b.offsets.Set(group, topic, offset)
	return offset
}

// Lag is the number of messages the group has not committed yet, or -1 for an unknown topic.
func (b *Broker) Lag(group, topic string) int {
	log, ok := b.logs[topic]
	if !ok {
		return -1
	}
	return log.Size() - b.offsets.Get(group, topic)
}
