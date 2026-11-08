import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { feedView, world } from './viz'

// JavaScript has no built-in heap. This small one keeps the item that wins less(a, b) on top.
export class Heap<T> {
  items: T[] = []
  less: (a: T, b: T) => boolean

  constructor(less: (a: T, b: T) => boolean) {
    this.less = less
  }

  get size(): number {
    return this.items.length
  }

  push(x: T): void {
    const a = this.items
    a.push(x)
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1
      if (!this.less(a[i], a[p])) break
      ;[a[i], a[p]] = [a[p], a[i]]
      i = p
    }
  }

  pop(): T {
    const a = this.items
    const top = a[0]
    const last = a.pop()!
    if (a.length > 0) {
      a[0] = last
      for (let i = 0; ; ) {
        let m = i
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < a.length && this.less(a[c], a[m])) m = c
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

export interface Tweet {
  time: number // a global counter, so a bigger time means a newer tweet
  id: number
}

// One entry in the merge heap: a tweet, whose author it is, and its position in that author's list.
export interface Candidate extends Tweet {
  user: number
  at: number
}

const FEED_SIZE = 10

export class Twitter {
  clock = 0
  tweets = new Map<number, Tweet[]>() // user -> their tweets, oldest first
  follows = new Map<number, Set<number>>() // user -> the users they follow

  postTweet(userId: number, tweetId: number, t: Tracer = noop): void {
    const mine = this.tweets.get(userId) ?? []
    mine.push({ time: this.clock++, id: tweetId }) // [1] stamp it with the clock and append: each list stays sorted by time
    this.tweets.set(userId, mine)
    t.step(1, `User ${userId} posts ${tweetId}. It gets time ${this.clock - 1}, so it is newer than every earlier tweet.`, world(this, userId))
  }

  follow(followerId: number, followeeId: number, t: Tracer = noop): void {
    const set = this.follows.get(followerId) ?? new Set<number>()
    set.add(followeeId) // [2] a set, so following twice changes nothing
    this.follows.set(followerId, set)
    t.step(2, `User ${followerId} follows ${followeeId}.`, world(this, followerId))
  }

  unfollow(followerId: number, followeeId: number, t: Tracer = noop): void {
    this.follows.get(followerId)?.delete(followeeId) // [2] removing a missing entry is harmless
    t.step(2, `User ${followerId} unfollows ${followeeId}.`, world(this, followerId))
  }

  getNewsFeed(userId: number, t: Tracer = noop): number[] {
    const heap = new Heap<Candidate>((a, b) => a.time > b.time) // newest tweet on top
    const people = new Set([userId, ...(this.follows.get(userId) ?? [])]) // you see your own tweets too
    for (const user of people) {
      const mine = this.tweets.get(user) ?? []
      if (mine.length > 0) heap.push({ ...mine[mine.length - 1], user, at: mine.length - 1 }) // [3] only each person's newest tweet can come first
    }
    t.step(3, `Feed for user ${userId}. Put the newest tweet of each person they see in a heap. The newest of those is on top.`, feedView(this, people, heap.items, []))
    const feed: number[] = []
    while (heap.size > 0 && feed.length < FEED_SIZE) {
      const top = heap.pop() // [4] the newest tweet among everyone's newest is the next feed entry
      feed.push(top.id)
      t.step(4, `Pop tweet ${top.id} (time ${top.time}) from user ${top.user}. It is the newest remaining, so it is next in the feed.`, feedView(this, people, heap.items, feed, top))
      if (top.at > 0) {
        const older = this.tweets.get(top.user)![top.at - 1]
        heap.push({ ...older, user: top.user, at: top.at - 1 }) // [5] that person's next older tweet becomes a candidate
        t.step(5, `User ${top.user} has an older tweet, ${older.id} (time ${older.time}). Push it as the new candidate.`, feedView(this, people, heap.items, feed, older))
      }
    }
    return feed
  }
}
