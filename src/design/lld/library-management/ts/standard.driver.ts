import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import { CappedFine, Library, PerDayFine, Reservations, type Book, type FinePolicy, type Member } from './standard'

// Replays operations against a real Library. Reservations and the fine policy are wrapped in spies,
// so the sequence diagram shows calls that really happened, in the order they happened.
const ACTORS = ['Client', 'Library', 'Reservations', 'FinePolicy']
const WHY: Record<number, string> = { [-1]: 'unknown member or book', [-2]: 'at the borrow limit', [-3]: 'no copy for this member' }

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let lib!: Library
  let limit = 0
  const out: unknown[] = []

  class SpyReservations extends Reservations {
    join(book: string, member: string) {
      log.push({ from: 'Library', to: 'Reservations', label: `join(${book}, ${member})` })
      const pos = super.join(book, member)
      log.push({ from: 'Reservations', to: 'Library', label: pos > 0 ? `position ${pos}` : 'already waiting', dashed: true, tone: pos > 0 ? 'hit' : 'miss' })
      return pos
    }
    next(book: string) {
      log.push({ from: 'Library', to: 'Reservations', label: `next(${book})` })
      const head = this.waiting(book)[0]
      const ok = super.next(book)
      log.push({ from: 'Reservations', to: 'Library', label: ok ? `hold for ${head}` : 'queue empty', dashed: true, tone: ok ? 'focus' : undefined })
      return ok
    }
    claim(book: string, member: string) {
      log.push({ from: 'Library', to: 'Reservations', label: `claim(${book}, ${member})` })
      const ok = super.claim(book, member)
      log.push({ from: 'Reservations', to: 'Library', label: ok ? 'held copy' : 'no hold', dashed: true, tone: ok ? 'focus' : undefined })
      return ok
    }
  }
  const res = new SpyReservations()
  const policySpy = (inner: FinePolicy): FinePolicy => ({
    fine(daysLate) {
      log.push({ from: 'Library', to: 'FinePolicy', label: `fine(${daysLate} days late)` })
      const f = inner.fine(daysLate)
      log.push({ from: 'FinePolicy', to: 'Library', label: `${f}`, dashed: true, tone: f > 0 ? 'miss' : 'hit' })
      return f
    },
  })

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const shelves = (hot?: string): Panel => {
    const rows = [...lib.books.values()].map((b: Book) => {
      const w = res.waiting(b.id)
      const h = res.held(b.id)
      return { key: b.id, items: [`shelf ${b.free}`, ...(h.length ? [`held: ${h.join(', ')}`] : []), ...(w.length ? [`queue: ${w.join(', ')}`] : [])], tone: b.id === hot ? ('focus' as const) : w.length || h.length ? ('keep' as const) : undefined }
    })
    return buckets(rows, { label: 'books: free copies on the shelf, copies held, queue (next first)', keyLabel: 'book' })
  }
  const people = (hot?: string): Panel => {
    const ms = [...lib.members.values()]
    return arr(ms.map((m: Member) => `${m.id} ${m.loans}/${limit}`), { label: 'members: books out / limit, red = at the limit', tones: ms.map((m) => (m.loans >= limit ? ('miss' as const) : m.id === hot ? ('focus' as const) : null)) })
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Library') {
      const [rows, names, lim, days, policy, rate, cap] = a as [[string, number][], string[], number, number, string, number, number]
      limit = lim
      const books = new Map(rows.map(([id, copies]) => [id, { id, free: copies }]))
      const members = new Map(names.map((id) => [id, { id, loans: 0 }]))
      lib = new Library(books, members, res, policySpy(policy === 'capped' ? new CappedFine(rate, cap) : new PerDayFine(rate)), lim, days)
      t.step(1, `A library with ${books.size} title${books.size === 1 ? '' : 's'} and ${members.size} member${members.size === 1 ? '' : 's'}. Each member may hold ${lim} books for ${days} days. The fine rule is "${policy}", handed in from outside.`, [people(), shelves()])
      out.push(null)
    } else if (op === 'borrow') {
      const [m, b, today] = a as [string, string, number]
      log.push({ from: 'Client', to: 'Library', label: `borrow(${m}, ${b}, day ${today})` })
      const code = lib.borrow(m, b, today)
      log.push({ from: 'Library', to: 'Client', label: code > 0 ? `loan ${code}, due day ${lib.dueOf(code)}` : WHY[code], dashed: true, tone: code > 0 ? 'hit' : 'miss' })
      if (code === -1) {
        t.step(2, `There is no ${lib.members.has(m) ? 'book' : 'member'} called ${lib.members.has(m) ? b : m}. Nothing changes.`, [diagram(), shelves()])
      } else if (code === -2) {
        t.step(2, `${m} already has ${limit} books out, the limit. The library refuses before it looks at any copy, so a held copy is not touched.`, [diagram(), people(m)])
      } else {
        t.step(2, `${m} has ${lib.count(m) - (code > 0 ? 1 : 0)} of ${limit} books out, so the limit allows it. Next: is there a copy for ${m}?`, [diagram(1), people(m)])
        t.step(3, code > 0 ? `The library asks Reservations for a held copy first, then the shelf. ${m} gets loan ${code}, due day ${lib.dueOf(code)}.` : `No copy is held for ${m} and the shelf has none free. Any copy that came back is held for the queue.`, [diagram(), shelves(b)])
      }
      out.push(code)
    } else if (op === 'reserve') {
      const [m, b] = a as [string, string]
      log.push({ from: 'Client', to: 'Library', label: `reserve(${m}, ${b})` })
      const code = lib.reserve(m, b)
      log.push({ from: 'Library', to: 'Client', label: code > 0 ? `queue position ${code}` : code === -2 ? 'a copy is free' : WHY[code] ?? 'already waiting', dashed: true, tone: code > 0 ? 'hit' : 'miss' })
      t.step(4, code > 0 ? `No copy is free, so ${m} joins the back of the queue for ${b}, at position ${code}.` : code === -2 ? `${b} has a free copy, so there is nothing to wait for. Borrow it.` : code === -3 ? `${m} is already waiting or holding a copy of ${b}. A second place in the queue would be unfair.` : 'Unknown member or book. Nothing changes.', [diagram(), shelves(b)])
      out.push(code)
    } else if (op === 'returnBook') {
      const [id, today] = a as [number, number]
      const before = lib.dueOf(id)
      log.push({ from: 'Client', to: 'Library', label: `returnBook(loan ${id}, day ${today})` })
      const fine = lib.returnBook(id, today)
      log.push({ from: 'Library', to: 'Client', label: fine < 0 ? 'unknown loan' : `fine ${fine}`, dashed: true, tone: fine < 0 ? 'miss' : fine > 0 ? 'miss' : 'hit' })
      if (fine < 0) {
        t.step(5, `Loan ${id} does not exist or was already returned, so nothing changes.`, [diagram(), shelves()])
      } else {
        const late = Math.max(0, today - before)
        t.step(5, late ? `Returned on day ${today}, due day ${before}: ${late} days late. The library does not know how much that costs. It asks the fine policy: ${fine}.` : `Returned on day ${today}, due day ${before}: on time. The policy is still asked, and answers 0.`, [diagram(3), people()])
        const head = log.find((x) => x.label.startsWith('hold for'))
        t.step(6, head ? `A reader is waiting. Instead of going on the shelf, the copy is held for ${head.label.slice(9)}. Nobody else can take it.` : 'Nobody is waiting, so the copy goes back on the shelf.', [diagram(), shelves()])
      }
      out.push(fine)
    } else if (op === 'dueOf' || op === 'count') {
      const v = op === 'dueOf' ? lib.dueOf(a[0] as number) : lib.count(a[0] as string)
      t.step(2, op === 'dueOf' ? `Loan ${a[0]} is due on day ${v}.` : `${a[0]} has ${v} book${v === 1 ? '' : 's'} out.`, [people(), shelves()])
      out.push(v)
    } else if (op === 'queue' || op === 'held') {
      const v = op === 'queue' ? res.waiting(a[0] as string) : res.held(a[0] as string)
      t.step(4, v.length ? `${op === 'queue' ? 'Waiting for' : 'A copy is held for'} ${a[0]}: ${v.join(', ')}.` : `Nobody is ${op === 'queue' ? 'waiting for' : 'holding a copy of'} ${a[0]}.`, [shelves(a[0] as string)])
      out.push(v)
    }
  })
  return out
}
