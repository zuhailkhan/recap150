export type ChannelName = 'email' | 'sms' | 'push'

/** A user's channels are always tried in this order, so results are deterministic. */
export const CHANNEL_ORDER: ChannelName[] = ['email', 'sms', 'push']

/** A value object: what was published. It never changes after it is made. */
export interface Notification {
  readonly topic: string
  readonly body: string
}

export interface User {
  id: string
  channels: ChannelName[] // the channels this user wants, in any order
  muted: boolean
}

/** One way to reach a user. send throws when delivery fails. */
export interface Channel {
  readonly name: ChannelName
  send(userId: string, n: Notification): void
}

/** Stands in for a real provider: it records what it sent, and can be told to fail. */
abstract class RecordingChannel implements Channel {
  abstract readonly name: ChannelName
  readonly sent: string[] = []

  constructor(public failing = false) {}

  send(userId: string, n: Notification): void {
    if (this.failing) throw new Error(`${this.name} is down`)
    this.sent.push(`${userId}:${n.topic}`)
  }
}
export class EmailChannel extends RecordingChannel {
  readonly name = 'email'
}
export class SmsChannel extends RecordingChannel {
  readonly name = 'sms'
}
export class PushChannel extends RecordingChannel {
  readonly name = 'push'
}

/** topic -> set of user ids. A Set ignores a second subscribe and keeps subscription order. */
export class Subscriptions {
  private byTopic = new Map<string, Set<string>>()

  add(topic: string, userId: string): boolean {
    let set = this.byTopic.get(topic)
    if (!set) this.byTopic.set(topic, (set = new Set()))
    if (set.has(userId)) return false
    set.add(userId)
    return true
  }

  remove(topic: string, userId: string): boolean {
    return this.byTopic.get(topic)?.delete(userId) ?? false
  }

  /** A copy, so a change during delivery cannot disturb the loop. */
  of(topic: string): string[] {
    return [...(this.byTopic.get(topic) ?? [])]
  }
}

export class NotificationService {
  readonly failures: string[] = [] // "channel:user" for every send that threw

  constructor(
    private users: Map<string, User>,
    private subs: Subscriptions,
    private channels: Map<ChannelName, Channel>,
  ) {}

  subscribe(userId: string, topic: string): boolean {
    if (!this.users.has(userId)) return false
    return this.subs.add(topic, userId) // [1] record the subscription, once per user and topic
  }

  unsubscribe(userId: string, topic: string): boolean {
    return this.subs.remove(topic, userId) // [2] forget it, so later events skip this user
  }

  setMuted(userId: string, muted: boolean): boolean {
    const user = this.users.get(userId)
    if (user) user.muted = muted
    return !!user
  }

  /** Returns "channel:user" for each delivery that worked: users in subscription order, channels in CHANNEL_ORDER. */
  publish(topic: string, body: string): string[] {
    const n: Notification = { topic, body }
    const delivered: string[] = []
    for (const id of this.subs.of(topic)) { // [3] look up who follows this topic
      const user = this.users.get(id)
      if (!user || user.muted) continue // [4] a muted user gets nothing
      for (const name of CHANNEL_ORDER) {
        if (!user.channels.includes(name)) continue
        try {
          this.channels.get(name)!.send(id, n) // [5] one channel throwing must not stop the others
          delivered.push(`${name}:${id}`)
        } catch {
          this.failures.push(`${name}:${id}`)
        }
      }
    }
    return delivered
  }
}
