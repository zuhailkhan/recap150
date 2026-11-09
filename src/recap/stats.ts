import { computed } from 'vue'
import { categoryList, readyMetas } from '@/data/problems'
import { readyHld, readyLld, trackGroups } from '@/data/design'
import { currentStreak, lastReviewed, progress } from './store'
import { dayNumber, isDue, isMastered, isNew } from './sm2'
import { dueCount, type Candidate } from './scheduler'

/** Three separate decks. A card id is the DSA slug itself, or "lld:<slug>" / "hld:<slug>" for design topics. */
export type Deck = 'dsa' | 'lld' | 'hld'
export const DECKS: { id: Deck; label: string; long: string }[] = [
  { id: 'dsa', label: 'DSA', long: 'Data structures and algorithms' },
  { id: 'lld', label: 'LLD', long: 'Low-level design' },
  { id: 'hld', label: 'HLD', long: 'High-level design' },
]
export const isDeck = (v: unknown): v is Deck => v === 'dsa' || v === 'lld' || v === 'hld'
export const cardId = (deck: Deck, slug: string) => (deck === 'dsa' ? slug : `${deck}:${slug}`)

export function candidatesFor(deck: Deck): Candidate[] {
  if (deck === 'lld') return readyLld.map((m) => ({ id: `lld:${m.slug}`, category: m.group }))
  if (deck === 'hld') return readyHld.map((m) => ({ id: `hld:${m.slug}`, category: m.group }))
  return readyMetas.map((m) => ({ id: m.slug, category: m.category }))
}
/** Back-compat: the DSA deck. */
export const candidates = candidatesFor('dsa')

/** Group (or category) names with written and total counts for a deck. */
function groupsFor(deck: Deck) {
  if (deck === 'dsa') return categoryList.map((c) => ({ name: c.name, total: c.entries.length, ids: c.entries.filter((e) => e.status === 'ready').map((e) => e.slug) }))
  return trackGroups(deck).map((g) => ({ name: g.name, total: g.entries.length, ids: g.entries.filter((e) => e.status === 'ready').map((e) => `${deck}:${e.slug}`) }))
}

export function useStats(deck: Deck = 'dsa') {
  const today = computed(() => dayNumber(Date.now()))
  const cands = computed(() => candidatesFor(deck))
  const due = computed(() => dueCount(cands.value, progress.cards, today.value))
  const streak = computed(() => currentStreak())
  const last = computed(() => lastReviewed())
  const reviewed = computed(() => cands.value.filter((c) => !isNew(progress.cards.get(c.id))).length)
  const categories = computed(() =>
    groupsFor(deck).map((g) => {
      const cards = g.ids.map((id) => progress.cards.get(id))
      return {
        name: g.name,
        total: g.total,
        ready: g.ids.length,
        reviewed: cards.filter((x) => !isNew(x)).length,
        mastered: cards.filter((x) => isMastered(x)).length,
        due: cards.filter((x) => x && isDue(x, today.value)).length,
      }
    }),
  )
  return { today, due, streak, last, reviewed, categories, cands }
}

/** Due cards across every deck, for the home page. */
export function useTotalDue() {
  const today = computed(() => dayNumber(Date.now()))
  return computed(() => DECKS.reduce((n, d) => n + dueCount(candidatesFor(d.id), progress.cards, today.value), 0))
}

export function relativeDay(ms: number): string {
  if (!ms) return 'never'
  const d = dayNumber(Date.now()) - dayNumber(ms)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}
