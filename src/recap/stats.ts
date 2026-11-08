import { computed } from 'vue'
import { categoryList, readyMetas } from '@/data/problems'
import { currentStreak, lastReviewed, progress } from './store'
import { dayNumber, isDue, isMastered, isNew } from './sm2'
import { dueCount } from './scheduler'

export const candidates = readyMetas.map((m) => ({ id: m.slug, category: m.category }))

export function useStats() {
  const today = computed(() => dayNumber(Date.now()))
  const due = computed(() => dueCount(candidates, progress.cards, today.value))
  const streak = computed(() => currentStreak())
  const last = computed(() => lastReviewed())
  const reviewed = computed(() => candidates.filter((c) => !isNew(progress.cards.get(c.id))).length)
  const categories = computed(() =>
    categoryList.map((c) => {
      const ready = c.entries.filter((e) => e.status === 'ready')
      const cards = ready.map((e) => progress.cards.get(e.slug))
      return {
        name: c.name,
        total: c.entries.length,
        ready: ready.length,
        reviewed: cards.filter((x) => !isNew(x)).length,
        mastered: cards.filter((x) => isMastered(x)).length,
        due: cards.filter((x) => x && isDue(x, today.value)).length,
      }
    }),
  )
  return { today, due, streak, last, reviewed, categories }
}

export function relativeDay(ms: number): string {
  if (!ms) return 'never'
  const d = dayNumber(Date.now()) - dayNumber(ms)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}
