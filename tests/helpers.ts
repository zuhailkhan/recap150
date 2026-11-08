import official from '../src/data/neetcode150.json'

export function compareProblemsForTest() {
  const counts: Record<string, number> = {}
  for (const p of official) counts[p.category] = (counts[p.category] ?? 0) + 1
  return { counts, total: official.length }
}
