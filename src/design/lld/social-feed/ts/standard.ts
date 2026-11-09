// Time is an integer passed in by the caller. Nothing here reads a clock.
export interface Post {
  readonly id: number
  readonly author: string
  readonly at: number
  readonly likes: Set<string> // who liked it, once each, in the order they did
}

/** Higher score ranks first. Equal scores rank the newer post (larger id) first, so the order is total. */
export interface FeedStrategy {
  score(p: Post): number
}

export class NewestFirst implements FeedStrategy {
  score(p: Post): number {
    return p.at
  }
}

export class MostLiked implements FeedStrategy {
  score(p: Post): number {
    return p.likes.size
  }
}

export interface LikeObserver {
  liked(post: Post, by: string): void
}

/** One observer: collects "someone liked your post" messages per author. */
export class Inbox implements LikeObserver {
  private messages = new Map<string, string[]>()

  liked(post: Post, by: string): void {
    if (by === post.author) return // liking your own post is not news
    const list = this.messages.get(post.author) ?? []
    list.push(`${by} liked post ${post.id}`)
    this.messages.set(post.author, list)
  }

  of(user: string): string[] {
    return [...(this.messages.get(user) ?? [])]
  }
}

/** A page of post ids. next is a cursor for the following page, or '' when there is no more. */
export interface Page {
  ids: number[]
  next: string
}

export class SocialFeed {
  readonly following = new Map<string, Set<string>>() // user -> who they follow, in follow order
  private byAuthor = new Map<string, Post[]>()
  readonly posts = new Map<number, Post>() // by id
  private nextId = 1

  constructor(
    users: string[], // [1] known users start with no follows and no posts
    private strategy: FeedStrategy,
    private observers: LikeObserver[],
  ) {
    for (const u of users) {
      this.following.set(u, new Set())
      this.byAuthor.set(u, [])
    }
  }

  follow(me: string, other: string): boolean {
    const set = this.following.get(me)
    if (!set || !this.following.has(other) || me === other || set.has(other)) return false
    set.add(other) // [2] a one-way edge: me now sees other's posts
    return true
  }

  unfollow(me: string, other: string): boolean {
    return this.following.get(me)?.delete(other) ?? false
  }

  post(user: string, at: number): number {
    const mine = this.byAuthor.get(user)
    if (!mine) return -1
    const p: Post = { id: this.nextId++, author: user, at, likes: new Set() } // [3] ids count up, the timestamp comes from the caller
    mine.push(p)
    this.posts.set(p.id, p)
    return p.id
  }

  like(user: string, postId: number): boolean {
    const p = this.posts.get(postId)
    if (!p || !this.following.has(user) || p.likes.has(user)) return false
    p.likes.add(user)
    for (const o of this.observers) o.liked(p, user) // [4] tell every observer, once per new like
    return true
  }

  /** Posts of the people you follow, ranked by the strategy, one page after the cursor. */
  feed(user: string, limit: number, cursor: string): Page {
    const ranked = [...(this.following.get(user) ?? [])]
      .flatMap((a) => this.byAuthor.get(a) ?? [])
      .map((p) => ({ id: p.id, score: this.strategy.score(p) })) // [5] score each post once, then order by score, then id
      .sort((a, b) => b.score - a.score || b.id - a.id)
    const at = /^(\d+):(\d+)$/.exec(cursor)
    if (limit < 1 || (cursor !== '' && !at)) return { ids: [], next: '' }
    const rest = at ? ranked.filter((r) => r.score < +at[1] || (r.score === +at[1] && r.id < +at[2])) : ranked // [6] keep what ranks after the cursor
    const page = rest.slice(0, limit)
    const last = page[page.length - 1]
    return { ids: page.map((r) => r.id), next: rest.length > limit ? `${last.score}:${last.id}` : '' }
  }
}
