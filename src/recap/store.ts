import { reactive } from 'vue'
import { z } from 'zod'
import { getAll, put, replaceAll } from '@/storage/db'
import { dayNumber, newCard, review, type CardState } from './sm2'
import type { Grade } from './config'

export interface LogEntry { id: string; grade: Grade; at: number }
interface Streak { count: number; lastDay: number }

export const progress = reactive({
  ready: false,
  cards: new Map<string, CardState>(),
  streak: { count: 0, lastDay: 0 } as Streak,
  log: [] as LogEntry[],
  storageError: '' as string,
})

export async function initProgress(): Promise<void> {
  try {
    const [cards, meta, log] = await Promise.all([getAll<CardState>('cards'), getAll<{ name: string; value: Streak }>('meta'), getAll<LogEntry>('log')])
    progress.cards = new Map(cards.map((c) => [c.id, c]))
    progress.streak = meta.find((m) => m.name === 'streak')?.value ?? { count: 0, lastDay: 0 }
    progress.log = log
  } catch (e) {
    progress.storageError = 'Progress cannot be saved in this browser (storage is blocked). Reviews will not persist.'
  }
  progress.ready = true
}

/** Streak as shown today: it survives until a full day is missed. */
export function currentStreak(todayMs = Date.now()): number {
  const today = dayNumber(todayMs)
  return progress.streak.lastDay >= today - 1 ? progress.streak.count : 0
}

export function lastReviewed(): number {
  let last = 0
  for (const c of progress.cards.values()) last = Math.max(last, c.last)
  return last
}

export async function rateCard(id: string, grade: Grade, nowMs = Date.now()): Promise<CardState> {
  const next = review(progress.cards.get(id) ?? newCard(id), grade, nowMs)
  progress.cards.set(id, next)
  const entry: LogEntry = { id, grade, at: nowMs }
  progress.log.push(entry)
  const today = dayNumber(nowMs)
  if (progress.streak.lastDay !== today) {
    progress.streak = { count: progress.streak.lastDay === today - 1 ? progress.streak.count + 1 : 1, lastDay: today }
  }
  try {
    await Promise.all([put('cards', next), put('log', entry), put('meta', { name: 'streak', value: { ...progress.streak } })])
  } catch {
    progress.storageError = 'Could not save that review to this browser.'
  }
  return next
}

// ---------- export / import ----------
const cardSchema = z.object({ id: z.string(), ease: z.number(), interval: z.number(), reps: z.number(), lapses: z.number(), due: z.number(), last: z.number() })
const backupSchema = z.object({
  app: z.literal('recap150'),
  version: z.literal(1),
  exportedAt: z.string(),
  cards: z.array(cardSchema),
  streak: z.object({ count: z.number(), lastDay: z.number() }),
  log: z.array(z.object({ id: z.string(), grade: z.enum(['again', 'hard', 'good', 'easy']), at: z.number() })),
})
export type Backup = z.infer<typeof backupSchema>

export function exportBackup(): string {
  const b: Backup = {
    app: 'recap150', version: 1, exportedAt: new Date().toISOString(),
    cards: [...progress.cards.values()], streak: { ...progress.streak }, log: [...progress.log],
  }
  return JSON.stringify(b, null, 2)
}

export function parseBackup(text: string): { backup?: Backup; error?: string } {
  let raw: unknown
  try { raw = JSON.parse(text) } catch { return { error: 'That is not valid JSON.' } }
  const r = backupSchema.safeParse(raw)
  if (!r.success) return { error: 'That JSON is not a Recap150 backup.' }
  return { backup: r.data }
}

/** merge: per card, the more recently reviewed copy wins. replace: wipe and load the backup. */
export async function importBackup(b: Backup, mode: 'merge' | 'replace'): Promise<void> {
  let cards = new Map(b.cards.map((c) => [c.id, c]))
  let streak = b.streak
  let log = b.log
  if (mode === 'merge') {
    cards = new Map(progress.cards)
    for (const c of b.cards) { const mine = cards.get(c.id); if (!mine || c.last > mine.last) cards.set(c.id, c) }
    if (b.streak.lastDay > progress.streak.lastDay) streak = b.streak; else streak = progress.streak
    const seen = new Set(progress.log.map((l) => `${l.id}|${l.at}`))
    log = [...progress.log, ...b.log.filter((l) => !seen.has(`${l.id}|${l.at}`))]
  }
  progress.cards = cards
  progress.streak = { ...streak }
  progress.log = log
  try {
    await replaceAll({ cards: [...cards.values()], meta: [{ name: 'streak', value: streak }], log })
  } catch { progress.storageError = 'Imported, but could not save to this browser.' }
}

export async function resetAll(): Promise<void> {
  progress.cards = new Map(); progress.streak = { count: 0, lastDay: 0 }; progress.log = []
  try { await replaceAll({ cards: [], meta: [], log: [] }) } catch { /* nothing stored anyway */ }
}
