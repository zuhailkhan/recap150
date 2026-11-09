/** One entry in a topic's log. The offset is its position, and it never changes. */
export interface Message {
  readonly offset: number
  readonly value: string
}

/** An append-only list of messages. Reading never removes anything. */
export interface Log {
  append(value: string): number // returns the new message's offset
  read(from: number, max: number): Message[]
  size(): number
}

export class MemoryLog implements Log {
  private msgs: Message[] = []

  append(value: string): number {
    const offset = this.msgs.length
    this.msgs.push({ offset, value })
    return offset
  }

  read(from: number, max: number): Message[] {
    return this.msgs.slice(from, from + Math.max(0, max))
  }

  size(): number {
    return this.msgs.length
  }
}

/** For each (group, topic): the offset of the next message the group has not finished. Starts at 0. */
export class Offsets {
  private next = new Map<string, number>()

  get(group: string, topic: string): number {
    return this.next.get(`${group}/${topic}`) ?? 0
  }

  set(group: string, topic: string, offset: number): void {
    this.next.set(`${group}/${topic}`, offset)
  }
}

export class Broker {
  constructor(
    private logs: Map<string, Log>,
    private offsets: Offsets,
  ) {}

  /** Returns the offset the message got, or -1 for an unknown topic. */
  publish(topic: string, value: string): number {
    const log = this.logs.get(topic)
    if (!log) return -1
    return log.append(value) // [1] the log only ever grows at the end
  }

  /** Up to max messages from the group's committed offset. Polling does not move the offset. null = unknown topic. */
  poll(group: string, topic: string, max: number): Message[] | null {
    const log = this.logs.get(topic)
    if (!log) return null
    const from = this.offsets.get(group, topic) // [2] each group has its own place in the log
    return log.read(from, max) // [3] the same read repeats until the group commits
  }

  /** offset = the next message to read, so "done with 0 and 1" is commit(2). Returns it, or -1 if refused. */
  commit(group: string, topic: string, offset: number): number {
    const log = this.logs.get(topic)
    if (!log) return -1
    if (offset < this.offsets.get(group, topic) || offset > log.size()) return -1 // [4] never backwards, never past the end
    this.offsets.set(group, topic, offset)
    return offset
  }

  /** Messages the group has not committed yet, or -1 for an unknown topic. */
  lag(group: string, topic: string): number {
    const log = this.logs.get(topic)
    return log ? log.size() - this.offsets.get(group, topic) : -1
  }
}
