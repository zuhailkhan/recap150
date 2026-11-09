import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, dp, mark2, seq, type Panel, type SeqMessage, type Tones } from '../../../../core/panels'
import { EqualSplit, ExactSplit, Group, Ledger, PercentSplit, type Payment, type Share, type SplitStrategy } from './standard'

// Replays operations against a real Group. The Ledger and the strategies are wrapped in spies, so the
// sequence diagram shows calls that really happened. Settle-up is replayed from the plan the Group returned.
const ACTORS = ['Caller', 'Group', 'SplitStrategy', 'Ledger']
const fmt = (p: Payment) => `${p.from}>${p.to}:${p.cents}`
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let members: string[] = []
  let ledger!: Ledger & { peek(): number[] }
  let lastShares: number[] = []
  let group!: Group
  let strategyCalled = false
  let refusal = ''
  const out: unknown[] = []

  class SpyLedger extends Ledger {
    transfer(debtor: string, creditor: string, cents: number) {
      log.push({ from: 'Group', to: 'Ledger', label: `transfer(${debtor} owes ${creditor}, ${cents})` })
      super.transfer(debtor, creditor, cents)
    }
    peek() {
      return super.nets() // reads without logging, for the state panels
    }
    nets() {
      const n = super.nets()
      log.push({ from: 'Group', to: 'Ledger', label: 'nets()' })
      log.push({ from: 'Ledger', to: 'Group', label: `[${n.join(', ')}]`, dashed: true, tone: 'focus' })
      return n
    }
  }

  const spy = (name: string, inner: SplitStrategy): SplitStrategy => ({
    split(amount, parts) {
      strategyCalled = true
      log.push({ from: 'Group', to: 'SplitStrategy', label: `${name}.split(${amount}, ${parts.length})` })
      try {
        const shares = inner.split(amount, parts)
        lastShares = shares
        log.push({ from: 'SplitStrategy', to: 'Group', label: `[${shares.join(', ')}]`, dashed: true, tone: 'hit' })
        return shares
      } catch (e) {
        refusal = (e as Error).message
        log.push({ from: 'SplitStrategy', to: 'Group', label: 'throws', dashed: true, tone: 'miss' })
        throw e
      }
    },
  })
  const strategies: Record<string, SplitStrategy> = { equal: spy('equal', new EqualSplit()), exact: spy('exact', new ExactSplit()), percent: spy('percent', new PercentSplit()) }

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const netPanel = (): Panel => {
    const nets = ledger.peek()
    return arr(members.map((m, i) => `${m} ${signed(nets[i])}`), {
      label: 'net balance in cents: green = is owed, red = owes',
      tones: nets.map((n) => (n > 0 ? ('hit' as const) : n < 0 ? ('miss' as const) : null)),
    })
  }
  const matrixPanel = (): Panel => {
    const cells = members.map(() => members.map(() => 0))
    for (const d of ledger.debts()) cells[members.indexOf(d.from)][members.indexOf(d.to)] = d.cents
    const hot: [number, number, 'keep'][] = []
    cells.forEach((row, r) => row.forEach((c, k) => c > 0 && hot.push([r, k, 'keep'])))
    return dp(cells, { label: 'who owes whom: the row owes the column (cents)', rowLabels: members, colLabels: members, tones: mark2(members.length, members.length, hot) })
  }
  const parse = (kind: string, raw: unknown[]): Share[] => raw.map((p) => (kind === 'equal' ? { user: p as string, value: 0 } : { user: (p as [string, number])[0], value: (p as [string, number])[1] }))

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Splitwise') {
      members = a[0] as string[]
      ledger = new SpyLedger(members)
      group = new Group(members, ledger)
      t.step(1, `A group of ${members.join(', ')}. The Ledger starts with no debts. Every net balance is 0, and the nets always add up to 0.`, [netPanel(), matrixPanel()])
      out.push(null)
    } else if (op === 'addExpense') {
      const [payer, amount, kind, raw] = a as [string, number, string, unknown[]]
      const parts = parse(kind, raw)
      strategyCalled = false
      refusal = ''
      log.push({ from: 'Caller', to: 'Group', label: `addExpense(${payer} paid ${amount}, ${kind})` })
      const ok = group.addExpense(payer, amount, parts, strategies[kind])
      log.push({ from: 'Group', to: 'Caller', label: ok ? 'recorded' : 'refused', dashed: true, tone: ok ? 'hit' : 'miss' })
      if (!ok) {
        const why = strategyCalled ? `The ${kind} strategy refused: ${refusal}.` : 'The group refused before splitting: an unknown member, an amount that is not positive whole cents, no participants, or a repeated participant.'
        t.step(strategyCalled ? 2 : 1, `${why} Nothing is recorded.`, [diagram(), netPanel()])
        out.push(0)
        return
      }
      // The split call and its answer are messages 2 and 3 of the log. The rest are ledger transfers.
      const shares = lastShares
      t.step(1, `${payer} paid ${amount} cents. The group checks that ${payer} and everyone in the split are members, and that nobody is listed twice.`, [diagram(1), netPanel()])
      const floors = parts.map((p) => (kind === 'equal' ? Math.floor(amount / parts.length) : Math.floor((amount * p.value) / 100)))
      const extra = kind === 'exact' ? 0 : amount - floors.reduce((x, y) => x + y, 0)
      const tones: Tones = shares.map((_, k) => (k < extra ? ('keep' as const) : null))
      t.step(2, `The ${kind} strategy divides ${amount} into ${shares.join(' + ')}.${extra > 0 ? ` Rounding left ${extra} cent${extra === 1 ? '' : 's'}, given one each to the first ${extra} participant${extra === 1 ? '' : 's'} (blue).` : ''}`, [diagram(3), arr(parts.map((p, k) => `${p.user} ${shares[k]}`), { label: 'shares in cents, in participant order', tones })])
      t.step(3, `Each participant now owes ${payer} their share. ${payer}'s own share is skipped, and a debt the other way round is cancelled first.`, [diagram(), matrixPanel(), netPanel()])
      out.push(1)
    } else if (op === 'pay') {
      const [from, to, cents] = a as [string, string, number]
      log.push({ from: 'Caller', to: 'Group', label: `pay(${from} to ${to}, ${cents})` })
      const ok = group.pay(from, to, cents)
      log.push({ from: 'Group', to: 'Caller', label: ok ? 'recorded' : 'refused', dashed: true, tone: ok ? 'hit' : 'miss' })
      t.step(3, ok ? `${from} paid ${to} ${cents}. The group records it as ${to} owing ${from} ${cents}, which cancels the debt the other way. Paying more than owed flips it.` : 'The group refused: unknown member, the same person twice, or an amount that is not positive whole cents.', [diagram(), matrixPanel(), netPanel()])
      out.push(ok ? 1 : 0)
    } else if (op === 'balances' || op === 'debts') {
      log.push({ from: 'Caller', to: 'Group', label: op === 'balances' ? 'balances()' : 'debts()' })
      const lines = op === 'balances' ? group.balances() : group.debts()
      log.push({ from: 'Group', to: 'Caller', label: lines.length ? `${lines.length} line${lines.length === 1 ? '' : 's'}` : 'none', dashed: true, tone: lines.length ? 'hit' : 'focus' })
      t.step(3, op === 'balances' ? 'The group asks the Ledger for every net balance. Above 0 means owed money, below 0 means owes.' : lines.length ? `Open debts, pair by pair: ${lines.join(', ')}. Opposite debts are already cancelled.` : 'No open debts.', [diagram(), matrixPanel(), netPanel()])
      out.push(lines)
    } else if (op === 'settle') {
      log.push({ from: 'Caller', to: 'Group', label: 'settle()' })
      const plan = group.settle()
      log.push({ from: 'Group', to: 'Caller', label: plan.length ? `${plan.length} payment${plan.length === 1 ? '' : 's'}` : 'all square', dashed: true, tone: plan.length ? 'hit' : 'focus' })
      const nets = ledger.peek()
      const open = ledger.debts().length
      t.step(4, plan.length ? `The group takes the net balances and runs the greedy matching. ${open} open debt${open === 1 ? '' : 's'} between pairs become ${plan.length} payment${plan.length === 1 ? '' : 's'}. At most one fewer than the number of people with a balance.` : 'Every net balance is 0, so there is nothing to pay.', [diagram(), arr(members.map((m, k) => `${m} ${signed(nets[k])}`), { label: 'net balance in cents', tones: nets.map((n) => (n > 0 ? ('hit' as const) : n < 0 ? ('miss' as const) : null)) })])
      // Replay the plan: the biggest creditor and debtor are matched each time.
      const bal = [...nets]
      plan.forEach((p, n) => {
        const c = members.indexOf(p.to)
        const d = members.indexOf(p.from)
        bal[c] -= p.cents
        bal[d] += p.cents
        t.step(4, `Payment ${n + 1}: ${p.from} pays ${p.to} ${p.cents}. That is the smaller of what ${p.to} is owed and what ${p.from} owes, so one of them reaches 0.`, [
          arr(members.map((m, k) => `${m} ${signed(bal[k])}`), { label: 'balances after this payment', tones: bal.map((b, k) => (k === c || k === d ? (b === 0 ? ('dim' as const) : ('focus' as const)) : b === 0 ? ('dim' as const) : null)) }),
          arr(plan.slice(0, n + 1).map(fmt), { label: 'payments so far', tones: plan.slice(0, n + 1).map((_p, k) => (k === n ? ('hit' as const) : null)) }),
        ])
      })
      out.push(plan.map(fmt))
    }
  })
  return out
}
