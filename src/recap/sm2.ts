import { RECAP, type Grade } from './config'

export interface CardState {
  id: string
  ease: number
  /** Days between the last review and the next one. */
  interval: number
  /** Successful recalls in a row. */
  reps: number
  lapses: number
  /** Local day number when the card is due (see dayNumber). */
  due: number
  /** Epoch ms of the last review. */
  last: number
}

const MS_DAY = 86_400_000

/** Whole local days since the epoch. Uses the local calendar day, so "today" flips at local midnight. */
export function dayNumber(ms: number): number {
  const d = new Date(ms)
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / MS_DAY)
}

export function newCard(id: string): CardState {
  return { id, ease: RECAP.startEase, interval: 0, reps: 0, lapses: 0, due: 0, last: 0 }
}

export function review(card: CardState, grade: Grade, nowMs: number): CardState {
  const today = dayNumber(nowMs)
  const ease = Math.max(RECAP.minEase, round2(card.ease + RECAP.easeDelta[grade]))
  if (grade === 'again') {
    return { ...card, ease, reps: 0, lapses: card.lapses + 1, interval: RECAP.lapseIntervalDays, due: today + RECAP.lapseIntervalDays, last: nowMs }
  }
  let interval: number
  if (card.reps === 0) interval = RECAP.firstIntervals[grade]
  else if (card.reps === 1) interval = RECAP.secondIntervals[grade]
  else if (grade === 'hard') interval = Math.round(card.interval * RECAP.hardMultiplier)
  else if (grade === 'good') interval = Math.round(card.interval * ease)
  else interval = Math.round(card.interval * ease * RECAP.easyBonus)
  interval = Math.max(1, interval)
  return { ...card, ease, reps: card.reps + 1, interval, due: today + interval, last: nowMs }
}

/** Days the card would wait for each grade, for the labels on the rating buttons. */
export function previewIntervals(card: CardState, nowMs: number): Record<Grade, number> {
  const out = {} as Record<Grade, number>
  for (const g of ['again', 'hard', 'good', 'easy'] as const) out[g] = review(card, g, nowMs).interval
  return out
}

export const isNew = (c: CardState | undefined) => !c || c.last === 0
export const isDue = (c: CardState, today: number) => c.last !== 0 && c.due <= today
export const isMastered = (c: CardState | undefined) => !!c && c.interval >= RECAP.masteredDays
export const isWeak = (c: CardState) => c.last !== 0 && (c.lapses > 0 || c.ease < RECAP.weakEase)

const round2 = (n: number) => Math.round(n * 100) / 100

export function formatInterval(days: number): string {
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}
