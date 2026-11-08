import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { Twitter } from './heap'

/** Replays the operations. One result per operation: null except getNewsFeed, which returns the list of tweet ids. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let tw: Twitter | null = null
  return ops.map((op, i) => {
    const a = args[i] as number[]
    if (op === 'Twitter') {
      tw = new Twitter()
      return null
    }
    if (!tw) throw new Error('Twitter must be created first')
    if (op === 'postTweet') tw.postTweet(a[0], a[1], t)
    else if (op === 'follow') tw.follow(a[0], a[1], t)
    else if (op === 'unfollow') tw.unfollow(a[0], a[1], t)
    else if (op === 'getNewsFeed') return tw.getNewsFeed(a[0], t)
    else throw new Error(`unknown operation ${op}`)
    return null
  })
}
