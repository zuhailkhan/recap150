import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, graph, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import { Inbox, MostLiked, NewestFirst, SocialFeed, type FeedStrategy, type LikeObserver } from './standard'

// Replays operations against a real SocialFeed. The strategy and the observer are wrapped in spies,
// so the sequence diagram shows calls that really happened, in the order they happened.
const ACTORS = ['Client', 'SocialFeed', 'FeedStrategy', 'Inbox']

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let quiet = false // true while the driver asks for the full ranking just to draw it
  let svc!: SocialFeed
  let real!: FeedStrategy
  let inbox!: Inbox
  let users: string[] = []
  let strategyName = ''
  const out: unknown[] = []

  const strategySpy = (inner: FeedStrategy): FeedStrategy => ({
    score(p) {
      const s = inner.score(p)
      if (!quiet) log.push({ from: 'SocialFeed', to: 'FeedStrategy', label: `score(post ${p.id}) = ${s}` })
      return s
    },
  })
  const observerSpy = (inner: LikeObserver): LikeObserver => ({
    liked(post, by) {
      log.push({ from: 'SocialFeed', to: 'Inbox', label: `liked(post ${post.id}, ${by})`, tone: 'focus' })
      inner.liked(post, by)
    },
  })

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const follows = (hot?: [string, string]): Panel =>
    graph(users, users.flatMap((a) => [...svc.following.get(a)!].map((b) => ({ from: a, to: b, directed: true, tone: hot && hot[0] === a && hot[1] === b ? ('focus' as const) : undefined }))), { label: 'who follows whom (arrow = follows)' })
  const postsPanel = (hot?: number): Panel => {
    const rows = users.map((u) => ({ key: u, items: [...svc.posts.values()].filter((p) => p.author === u).map((p) => `#${p.id} t=${p.at} likes=${p.likes.size}`), tone: undefined as 'focus' | undefined }))
    for (const r of rows) if (hot !== undefined && r.items.some((x) => x.startsWith(`#${hot} `))) r.tone = 'focus'
    return buckets(rows, { label: 'posts by author (t = timestamp)', keyLabel: 'author', empty: 'no posts yet' })
  }
  const inboxPanel = (): Panel =>
    buckets(users.map((u) => ({ key: u, items: inbox.of(u) })).filter((r) => r.items.length), { label: 'inbox: like notifications per author', keyLabel: 'author', empty: 'no notifications' })
  const ranking = (user: string): number[] => {
    quiet = true
    const ids = svc.feed(user, 100000, '').ids
    quiet = false
    return ids
  }
  const rankedPanel = (ids: number[], tones?: ('hit' | 'dim' | null)[]): Panel =>
    arr(ids.map((id) => `#${id} s=${real.score(svc.posts.get(id)!)}`), { label: 'ranked: higher score first, then newer id', tones })

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'SocialFeed') {
      users = a[0] as string[]
      strategyName = a[1] as string
      real = strategyName === 'liked' ? new MostLiked() : new NewestFirst()
      inbox = new Inbox()
      svc = new SocialFeed(users, strategySpy(real), [observerSpy(inbox)])
      t.step(1, `The service knows ${users.length} user${users.length === 1 ? '' : 's'}: ${users.join(', ')}. It is handed the "${strategyName}" ranking and one like observer, the inbox.`, [follows(), postsPanel()])
      out.push(null)
    } else if (op === 'follow' || op === 'unfollow') {
      const [me, other] = a as [string, string]
      log.push({ from: 'Client', to: 'SocialFeed', label: `${op}(${me}, ${other})` })
      const ok = op === 'follow' ? svc.follow(me, other) : svc.unfollow(me, other)
      log.push({ from: 'SocialFeed', to: 'Client', label: ok ? 'done' : 'no change', dashed: true, tone: ok ? 'hit' : 'miss' })
      const why = me === other ? 'Nobody follows themselves.' : !users.includes(me) || !users.includes(other) ? 'One of them is not a known user.' : op === 'follow' ? `${me} already follows ${other}.` : `${me} does not follow ${other}.`
      t.step(2, ok ? (op === 'follow' ? `${me} now follows ${other}. It is one-way: ${other}'s posts reach ${me}, not the other way round.` : `${me} no longer follows ${other}, so ${other}'s posts leave ${me}'s feed.`) : `${why} Nothing changes.`, [diagram(), follows(ok && op === 'follow' ? [me, other] : undefined)])
      out.push(ok ? 1 : 0)
    } else if (op === 'post') {
      const [user, at] = a as [string, number]
      log.push({ from: 'Client', to: 'SocialFeed', label: `post(${user}, t=${at})` })
      const id = svc.post(user, at)
      log.push({ from: 'SocialFeed', to: 'Client', label: id < 0 ? 'unknown user' : `post ${id}`, dashed: true, tone: id < 0 ? 'miss' : 'hit' })
      t.step(3, id < 0 ? `There is no user ${user}, so no post is made and no id is used.` : `${user} posts. The id is the next counter value (${id}) and the timestamp ${at} comes from the caller, so ordering is exact.`, [diagram(), postsPanel(id < 0 ? undefined : id)])
      out.push(id)
    } else if (op === 'like') {
      const [user, postId] = a as [string, number]
      log.push({ from: 'Client', to: 'SocialFeed', label: `like(${user}, post ${postId})` })
      const ok = svc.like(user, postId)
      log.push({ from: 'SocialFeed', to: 'Client', label: ok ? 'liked' : 'no change', dashed: true, tone: ok ? 'hit' : 'miss' })
      const p = svc.posts.get(postId)
      t.step(4, ok ? `${user} likes post ${postId}. The service tells every observer once${p && p.author === user ? ', but the inbox ignores a like on your own post' : ''}.` : `${svc.posts.has(postId) ? (users.includes(user) ? `${user} already liked post ${postId}, so nothing doubles and no one is told twice.` : `There is no user ${user}.`) : `There is no post ${postId}.`}`, [diagram(), postsPanel(ok ? postId : undefined), inboxPanel()])
      out.push(ok ? 1 : 0)
    } else if (op === 'inbox') {
      const [user] = a as [string]
      log.push({ from: 'Client', to: 'Inbox', label: `of(${user})` })
      const msgs = inbox.of(user)
      log.push({ from: 'Inbox', to: 'Client', label: msgs.length ? `${msgs.length} message${msgs.length === 1 ? '' : 's'}` : 'none', dashed: true, tone: msgs.length ? 'hit' : 'miss' })
      t.step(4, msgs.length ? `The inbox kept ${msgs.length} message${msgs.length === 1 ? '' : 's'} for ${user}, in the order the likes happened.` : `${user} has no like notifications.`, [diagram(), inboxPanel()])
      out.push(msgs)
    } else if (op === 'feed') {
      const [user, limit, cursor] = a as [string, number, string]
      log.push({ from: 'Client', to: 'SocialFeed', label: `feed(${user}, limit ${limit}, "${cursor}")` })
      const page = svc.feed(user, limit, cursor)
      const scored = log.length
      log.push({ from: 'SocialFeed', to: 'Client', label: `[${page.ids.join(', ')}]${page.next ? ` next "${page.next}"` : ''}`, dashed: true, tone: page.ids.length ? 'hit' : 'miss' })
      const all = ranking(user)
      const followees = [...(svc.following.get(user) ?? [])]
      t.step(5, `The service gathers the posts of everyone ${user} follows (${followees.join(', ') || 'nobody'}) and asks the strategy for each score once. Ranked by score, then newer id: ${all.length ? all.map((id) => `#${id}`).join(', ') : 'nothing to rank'}.`, [diagram(scored), rankedPanel(all)])
      const valid = limit >= 1 && (cursor === '' || /^\d+:\d+$/.test(cursor))
      if (!valid) {
        t.step(6, `The cursor "${cursor}" is not of the form score:id, or the limit is below 1. The page is empty and there is no next cursor.`, [diagram(), rankedPanel(all, all.map(() => 'dim'))])
      } else {
        const first = page.ids.length ? all.indexOf(page.ids[0]) : all.length
        const tones = all.map((id, k) => (page.ids.includes(id) ? ('hit' as const) : k < first ? ('dim' as const) : null))
        t.step(6, `${cursor ? `Skip everything ranked at or before the cursor "${cursor}". ` : 'No cursor, so start at the top. '}Take ${limit}: ${page.ids.length ? page.ids.map((id) => `#${id}`).join(', ') : 'nothing'}. ${page.next ? `More remain, so the next cursor is "${page.next}": the score and id of the last post returned.` : 'Nothing remains, so there is no next cursor.'}`, [diagram(), rankedPanel(all, tones)])
      }
      out.push([page.ids, page.next])
    }
  })
  return out
}
