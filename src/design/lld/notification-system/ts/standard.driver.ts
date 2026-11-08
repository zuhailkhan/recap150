import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import {
  CHANNEL_ORDER, EmailChannel, NotificationService, PushChannel, SmsChannel, Subscriptions,
  type Channel, type ChannelName, type Notification, type User,
} from './standard'

// Replays operations against a real NotificationService. Subscriptions and each channel are wrapped,
// so the sequence diagram shows calls that really happened, in the order they happened.
const ACTORS = ['Caller', 'Service', 'Subscriptions', 'Channel']

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const users = new Map<string, User>()
  const topics: string[] = [] // topics seen so far, in first-use order, for the state panel
  let svc!: NotificationService
  let real: Record<ChannelName, EmailChannel | SmsChannel | PushChannel>
  const out: unknown[] = []

  // Subscriptions that logs each call. peek reads without logging, for the state panel.
  class SpySubs extends Subscriptions {
    add(topic: string, userId: string) {
      log.push({ from: 'Service', to: 'Subscriptions', label: `add(${topic}, ${userId})` })
      const added = super.add(topic, userId)
      log.push({ from: 'Subscriptions', to: 'Service', label: added ? 'added' : 'already there', dashed: true, tone: added ? 'hit' : 'miss' })
      return added
    }
    remove(topic: string, userId: string) {
      log.push({ from: 'Service', to: 'Subscriptions', label: `remove(${topic}, ${userId})` })
      const removed = super.remove(topic, userId)
      log.push({ from: 'Subscriptions', to: 'Service', label: removed ? 'removed' : 'was not there', dashed: true, tone: removed ? 'hit' : 'miss' })
      return removed
    }
    of(topic: string) {
      log.push({ from: 'Service', to: 'Subscriptions', label: `of(${topic})` })
      const ids = super.of(topic)
      log.push({ from: 'Subscriptions', to: 'Service', label: ids.length ? `[${ids.join(', ')}]` : 'nobody', dashed: true, tone: ids.length ? 'focus' : 'miss' })
      return ids
    }
    peek(topic: string) {
      return super.of(topic)
    }
  }
  const subs = new SpySubs()

  const spy = (inner: Channel): Channel => ({
    name: inner.name,
    send(userId: string, n: Notification) {
      log.push({ from: 'Service', to: 'Channel', label: `${inner.name}(${userId})` })
      try {
        inner.send(userId, n)
      } catch (e) {
        log.push({ from: 'Channel', to: 'Service', label: 'throws', dashed: true, tone: 'miss' })
        throw e
      }
      log.push({ from: 'Channel', to: 'Service', label: 'sent', dashed: true, tone: 'hit' })
    },
  })

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const subsPanel = (hot?: string): Panel =>
    buckets(topics.map((tp) => ({ key: tp, items: subs.peek(tp), tone: tp === hot ? ('focus' as const) : undefined })), {
      label: 'subscriptions: topic to user ids, in subscription order', keyLabel: 'topic', empty: 'no subscriptions yet',
    })
  const usersPanel = (): Panel => {
    const all = [...users.values()]
    return arr(all.map((u) => `${u.id}${u.muted ? ' (muted)' : ''}: ${u.channels.join('+')}`), { label: 'users and their channels, red = muted', tones: all.map((u) => (u.muted ? ('miss' as const) : null)) })
  }
  const sentPanel = (tones: Record<string, 'hit' | 'miss'> = {}): Panel =>
    buckets(CHANNEL_ORDER.map((name) => ({ key: name, items: real[name].sent, tone: tones[name] ?? (real[name].failing ? ('miss' as const) : undefined) })), {
      label: 'delivery log: what each channel recorded (red = configured to fail)', keyLabel: 'channel', empty: 'nothing sent',
    })

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'NotificationService') {
      const failing = new Set(a[1] as string[])
      users.clear()
      for (const [id, channels, muted] of a[0] as [string, ChannelName[], number][]) users.set(id, { id, channels, muted: muted === 1 })
      real = { email: new EmailChannel(failing.has('email')), sms: new SmsChannel(failing.has('sms')), push: new PushChannel(failing.has('push')) }
      const channels = new Map<ChannelName, Channel>(CHANNEL_ORDER.map((n) => [n, spy(real[n])]))
      svc = new NotificationService(users, subs, channels)
      t.step(1, `The service is built with ${users.size} user${users.size === 1 ? '' : 's'}, an empty Subscriptions, and one Channel object per kind.${failing.size ? ` ${[...failing].join(' and ')} is set to fail.` : ''}`, [usersPanel(), sentPanel()])
      out.push(null)
    } else if (op === 'subscribe') {
      const [id, topic] = a as [string, string]
      log.push({ from: 'Caller', to: 'Service', label: `subscribe(${id}, ${topic})` })
      const ok = svc.subscribe(id, topic)
      if (ok && !topics.includes(topic)) topics.push(topic)
      if (!users.has(id)) log.push({ from: 'Service', to: 'Caller', label: 'unknown user', dashed: true, tone: 'miss' })
      else log.push({ from: 'Service', to: 'Caller', label: ok ? 'subscribed' : 'no change', dashed: true, tone: ok ? 'hit' : 'miss' })
      t.step(1, !users.has(id) ? `There is no user ${id}, so the service refuses before touching Subscriptions.` : ok ? `${id} is added to the set for ${topic}.` : `${id} already follows ${topic}. A Set ignores the second add, so nothing doubles.`, [diagram(), subsPanel(topic)])
      out.push(ok ? 1 : 0)
    } else if (op === 'unsubscribe') {
      const [id, topic] = a as [string, string]
      log.push({ from: 'Caller', to: 'Service', label: `unsubscribe(${id}, ${topic})` })
      const ok = svc.unsubscribe(id, topic)
      log.push({ from: 'Service', to: 'Caller', label: ok ? 'unsubscribed' : 'no change', dashed: true, tone: ok ? 'hit' : 'miss' })
      t.step(2, ok ? `${id} is removed from ${topic}. The next event on it will skip ${id}.` : `${id} was not following ${topic}, so nothing changes.`, [diagram(), subsPanel(topic)])
      out.push(ok ? 1 : 0)
    } else if (op === 'mute') {
      const [id, flag] = a as [string, number]
      log.push({ from: 'Caller', to: 'Service', label: `setMuted(${id}, ${flag === 1})` })
      const ok = svc.setMuted(id, flag === 1)
      log.push({ from: 'Service', to: 'Caller', label: ok ? 'done' : 'unknown user', dashed: true, tone: ok ? 'hit' : 'miss' })
      t.step(4, ok ? `${id} is ${flag === 1 ? 'muted. Publishes will skip' : 'unmuted. Publishes will reach'} ${id}, and the subscription stays.` : `There is no user ${id}.`, [diagram(), usersPanel()])
      out.push(ok ? 1 : 0)
    } else if (op === 'publish') {
      const [topic, body] = a as [string, string]
      const failedBefore = svc.failures.length
      log.push({ from: 'Caller', to: 'Service', label: `publish(${topic})` })
      const delivered = svc.publish(topic, body)
      const failed = svc.failures.slice(failedBefore)
      const ids = subs.peek(topic)
      const muted = ids.filter((id) => users.get(id)?.muted)
      log.push({ from: 'Service', to: 'Caller', label: `${delivered.length} delivered`, dashed: true, tone: delivered.length ? 'hit' : 'miss' })
      t.step(3, ids.length ? `The service asks Subscriptions who follows ${topic}. The answer is ${ids.join(', ')}, in subscription order.` : `Nobody follows ${topic}. The service gets an empty answer and sends nothing.`, [diagram(ids.length ? 3 : log.length), subsPanel(topic)])
      if (muted.length) t.step(4, `${muted.join(' and ')} ${muted.length === 1 ? 'is' : 'are'} muted, so the service skips them: no channel is called for them.`, [diagram(3), usersPanel()])
      if (delivered.length + failed.length) {
        t.step(5, `Each wanted channel is called in the order email, sms, push. ${delivered.length} worked${failed.length ? `, ${failed.join(' and ')} threw and was recorded, and the loop went on` : ''}.`, [diagram(), sentPanel()])
      }
      out.push(delivered)
    } else if (op === 'failures') {
      log.push({ from: 'Caller', to: 'Service', label: 'failures' })
      log.push({ from: 'Service', to: 'Caller', label: `${svc.failures.length} recorded`, dashed: true, tone: svc.failures.length ? 'miss' : 'hit' })
      t.step(5, svc.failures.length ? `The service kept a list of sends that threw: ${svc.failures.join(', ')}.` : 'No send has failed so far.', [diagram(), sentPanel()])
      out.push([...svc.failures])
    }
  })
  return out
}
