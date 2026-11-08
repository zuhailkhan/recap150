// Trace-only drawing helpers. Never shown on the page.
import { buckets, grid, type Cell, type Panel, type Tone } from '../../../core/panels'

type Pt = number[]
interface Marks { query?: Pt; cand?: Pt; corners?: Pt[] }

const LIMIT = 7

/**
 * The stored points as a small grid (x across, y up, cell = number of copies).
 * Query and candidate are focus. A corner is hit if it is stored, miss if it is not. Stored points are keep.
 * Coordinates that do not fit a small grid fall back to a list.
 */
export function plot(copies: Map<string, number>, o: Marks = {}): Panel {
  const stored = [...copies].map(([k, n]) => ({ p: k.split(',').map(Number), n }))
  const extra = [o.query, o.cand, ...(o.corners ?? [])].filter((p): p is Pt => !!p)
  const all = [...stored.map((s) => s.p), ...extra]
  const small = all.every(([x, y]) => x >= 0 && y >= 0 && x <= LIMIT && y <= LIMIT)
  const has = (p: Pt) => (copies.get(`${p[0]},${p[1]}`) ?? 0) > 0
  if (!small) {
    const rows = stored.slice(0, 12).map((s) => ({ key: `(${s.p[0]}, ${s.p[1]})`, items: [s.n] as Cell[] }))
    if (o.query) rows.unshift({ key: `query (${o.query[0]}, ${o.query[1]})`, items: ['?'] })
    return buckets(rows, { label: 'stored points and their copies', empty: 'no points yet' })
  }
  const w = Math.max(1, ...all.map((p) => p[0] + 1))
  const h = Math.max(1, ...all.map((p) => p[1] + 1))
  const cells: Cell[][] = Array.from({ length: h }, () => Array<Cell>(w).fill(''))
  const tones: (Tone | null)[][] = Array.from({ length: h }, () => Array<Tone | null>(w).fill(null))
  const put = (p: Pt, tone: Tone) => { tones[h - 1 - p[1]][p[0]] = tone }
  for (const s of stored) { cells[h - 1 - s.p[1]][s.p[0]] = s.n; put(s.p, 'keep') }
  for (const c of o.corners ?? []) put(c, has(c) ? 'hit' : 'miss')
  if (o.cand) put(o.cand, 'focus')
  if (o.query) { put(o.query, 'focus'); if (!has(o.query)) cells[h - 1 - o.query[1]][o.query[0]] = '?' }
  return grid(cells, { label: 'points: x across, y up. Number = copies stored. ? = the query', tones })
}
