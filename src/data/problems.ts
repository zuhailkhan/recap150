import official from './neetcode150.json'
import type { ProblemMeta, ReadyMeta, Variant } from '@/core/schema'
import { CATEGORIES } from '@/core/schema'
import { stripGoPackage, stripTraceCode } from '@/core/codeUtils'

export interface OfficialEntry { slug: string; title: string; category: string; difficulty: 'Easy' | 'Medium' | 'Hard'; video: string | null }

export const OFFICIAL = official as OfficialEntry[]
export const officialBySlug = new Map(OFFICIAL.map((o) => [o.slug, o]))

const metaMods = import.meta.glob('../problems/*/meta.json', { eager: true, import: 'default' }) as Record<string, ProblemMeta>
export const metas = new Map<string, ProblemMeta>()
for (const [path, m] of Object.entries(metaMods)) metas.set(path.split('/')[2], m)

/** Ready problems only. Drafts are never offered to recap. */
export const readyMetas: ReadyMeta[] = [...metas.values()].filter((m): m is ReadyMeta => m.status === 'ready')
export const readyBySlug = new Map(readyMetas.map((m) => [m.slug, m]))

export const categoryList = CATEGORIES.map((name) => {
  const entries = OFFICIAL.filter((o) => o.category === name).map((o) => ({ ...o, status: (metas.get(o.slug)?.status ?? 'todo') as 'ready' | 'draft' | 'todo' }))
  return { name, entries, ready: entries.filter((e) => e.status === 'ready').length }
})

export const leetcodeUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`
export const videoUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`
export const NEETCODE_LIST_URL = 'https://neetcode.io/practice?tab=neetcode150'

// ---- lazily loaded code and solvers (kept out of the first bundle)
const raw = import.meta.glob('../problems/*/{ts/*.ts,go/*.go,pseudo/*.txt}', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>
const modules = import.meta.glob('../problems/*/ts/*.ts') as Record<string, () => Promise<Record<string, (...a: any[]) => unknown>>>

export interface LoadedVariant extends Variant { pseudo: string; ts: string; go: string; fn: (...a: any[]) => unknown }

export async function loadVariants(meta: ReadyMeta): Promise<LoadedVariant[]> {
  return Promise.all(meta.variants.map(async (v) => {
    const base = `../problems/${meta.slug}`
    const [pseudo, ts, go, mod] = await Promise.all([
      raw[`${base}/pseudo/${v.id}.txt`](), raw[`${base}/ts/${v.id}.ts`](), raw[`${base}/go/${v.id}.go`](), modules[`${base}/ts/${v.id}.ts`](),
    ])
    return { ...v, pseudo, ts: stripTraceCode(ts), go: stripGoPackage(go), fn: mod[v.tsFn] }
  }))
}
