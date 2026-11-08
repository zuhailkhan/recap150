import { defineAsyncComponent, type Component } from 'vue'
import catalogJson from '../design/catalog.json'
import type { CatalogEntry, HldMeta, LldMeta } from '@/core/designSchema'
import { HLD_GROUPS, LLD_GROUPS } from '@/core/designSchema'
import { stripGoPackage, stripTraceCode } from '@/core/codeUtils'

export type Track = 'dsa' | 'lld' | 'hld'
export const CATALOG = catalogJson as CatalogEntry[]

type AnyDesignMeta = { slug: string; title: string; group: string; difficulty: 'Easy' | 'Medium' | 'Hard'; status: 'ready' | 'draft' }
const lldMods = import.meta.glob('../design/lld/*/meta.json', { eager: true, import: 'default' }) as Record<string, AnyDesignMeta>
const hldMods = import.meta.glob('../design/hld/*/meta.json', { eager: true, import: 'default' }) as Record<string, AnyDesignMeta>

export const lldMetas = new Map<string, AnyDesignMeta>(Object.entries(lldMods).map(([p, m]) => [p.split('/')[3], m]))
export const hldMetas = new Map<string, AnyDesignMeta>(Object.entries(hldMods).map(([p, m]) => [p.split('/')[3], m]))
export const readyLld = [...lldMetas.values()].filter((m) => m.status === 'ready') as unknown as LldMeta[]
export const readyHld = [...hldMetas.values()].filter((m) => m.status === 'ready') as unknown as HldMeta[]

export function trackGroups(track: 'lld' | 'hld') {
  const metas = track === 'lld' ? lldMetas : hldMetas
  const names = track === 'lld' ? LLD_GROUPS : HLD_GROUPS
  return names.map((name) => {
    const entries = CATALOG.filter((c) => c.track === track && c.group === name).map((c) => ({ ...c, status: (metas.get(c.slug)?.status ?? 'todo') as 'ready' | 'draft' | 'todo' }))
    return { name, entries, ready: entries.filter((e) => e.status === 'ready').length }
  }).filter((g) => g.entries.length)
}

export const catalogBySlug = (track: 'lld' | 'hld', slug: string) => CATALOG.find((c) => c.track === track && c.slug === slug)

// ---- LLD code, loaded lazily per problem
const raw = import.meta.glob('../design/lld/*/{ts/*.ts,go/*.go}', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>
const modules = import.meta.glob('../design/lld/*/ts/*.ts') as Record<string, () => Promise<Record<string, (...a: any[]) => unknown>>>
const demos = import.meta.glob('../design/lld/*/Demo.vue') as Record<string, () => Promise<{ default: Component }>>

export interface LldVariant { id: string; label: string; tsFn: string; goFn: string; stages: { n: number; title: string; note: string }[]; ts: string; go: string; fn: (...a: any[]) => unknown }

export async function loadLldVariants(meta: LldMeta): Promise<LldVariant[]> {
  return Promise.all(meta.variants.map(async (v) => {
    const base = `../design/lld/${meta.slug}`
    const [ts, go, mod] = await Promise.all([raw[`${base}/ts/${v.id}.ts`](), raw[`${base}/go/${v.id}.go`](), (modules[`${base}/ts/${v.id}.driver.ts`] ?? modules[`${base}/ts/${v.id}.ts`])()])
    return { ...v, ts: stripTraceCode(ts), go: stripGoPackage(go), fn: mod[v.tsFn] }
  }))
}
export function lldDemo(slug: string): Component | undefined {
  const load = demos[`../design/lld/${slug}/Demo.vue`]
  return load ? defineAsyncComponent(load) : undefined
}
