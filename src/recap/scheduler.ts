import { RECAP } from './config'
import { isDue, isNew, isWeak, type CardState } from './sm2'

export interface Candidate { id: string; category: string }

/** Due cards (most overdue first), then a few new ones, up to the daily cap. */
export function buildDaily(cands: Candidate[], cards: Map<string, CardState>, today: number): string[] {
  const due = cands
    .filter((c) => { const s = cards.get(c.id); return s && isDue(s, today) })
    .sort((a, b) => cards.get(a.id)!.due - cards.get(b.id)!.due)
    .map((c) => c.id)
    .slice(0, RECAP.dailyCap)
  const room = RECAP.dailyCap - due.length
  const fresh = cands.filter((c) => isNew(cards.get(c.id))).map((c) => c.id).slice(0, Math.min(room, RECAP.newPerDay))
  return [...due, ...fresh]
}

/** Every card in the category: due first, then new, then the rest by soonest due. */
export function buildCategory(cands: Candidate[], cards: Map<string, CardState>, today: number, category: string): string[] {
  const rank = (id: string) => { const s = cards.get(id); return isNew(s) ? 1 : isDue(s!, today) ? 0 : 2 }
  return cands
    .filter((c) => c.category === category)
    .map((c) => c.id)
    .sort((a, b) => rank(a) - rank(b) || (cards.get(a)?.due ?? 0) - (cards.get(b)?.due ?? 0))
}

/** Lowest ease and most lapses first. */
export function buildWeak(cands: Candidate[], cards: Map<string, CardState>): string[] {
  return cands
    .map((c) => cards.get(c.id))
    .filter((s): s is CardState => !!s && isWeak(s))
    .sort((a, b) => a.ease - b.ease || b.lapses - a.lapses)
    .slice(0, RECAP.weakCap)
    .map((s) => s.id)
}

export function dueCount(cands: Candidate[], cards: Map<string, CardState>, today: number): number {
  return cands.filter((c) => { const s = cards.get(c.id); return s && isDue(s, today) }).length
}
