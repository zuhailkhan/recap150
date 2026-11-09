import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, dp, seq, type Panel, type SeqMessage, type Tone } from '../../../../core/panels'
import { ATM, Bank, Dispenser, type Note } from './chain'

// Replays operations against a real ATM. The states, the bank and the dispenser are patched with small spies,
// so the sequence diagram shows calls that really happened. Each note handler records its own hop for the chain table.
const ACTORS = ['Client', 'ATM', 'State', 'Bank', 'Dispenser']
const STATES = ['Idle', 'CardInserted', 'Authenticated']
type Obj = Record<string, (...a: unknown[]) => unknown>
interface Hop { denom: number; asked: number; take: number; stock: number }

const fmtNotes = (ns: Note[]): string => ns.map((n) => `${n.denom}x${n.n}`).join(' ')

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let hops: Hop[] = []
  let atm!: ATM
  let bank!: Bank
  let disp!: Dispenser
  let maxFails = 0
  let limit = 0
  const out: unknown[] = []

  const stateName = (s: unknown): string => (s === atm.idle ? 'Idle' : s === atm.cardIn ? 'CardInserted' : 'Authenticated')
  const nameOf = (): string => stateName(atm.state)

  const views = (): Panel[] => [
    arr(STATES, { label: 'current state (blue = active)', tones: STATES.map((s) => (s === nameOf() ? ('focus' as const) : null)) }),
    buckets(
      [...bank.accounts].map(([card, a]) => ({
        key: card,
        items: [`bal ${a.balance}`, `fails ${a.fails}/${maxFails}`, `out ${a.withdrawn}/${limit}`, ...(a.locked ? ['LOCKED'] : [])],
        tone: a.locked ? ('miss' as const) : card === atm.card ? ('focus' as const) : undefined,
      })),
      { label: 'accounts (blue = card in the slot)', keyLabel: '' },
    ),
    arr(disp.handlers.map((h) => `${h.denom} x${h.stock}`), { label: 'cash in the machine (note x stock)' }),
  ]
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const chain = (failed: boolean): Panel => {
    const rows = disp.handlers.map((h) => hops.find((x) => x.denom === h.denom))
    const last = rows.reduce((k, r, j) => (r ? j : k), -1)
    const tones: (Tone | null)[][] = rows.map((r, j) => {
      const tone: Tone | null = !r ? null : failed && j === last ? 'miss' : r.take > 0 ? 'hit' : 'dim'
      return [tone, tone, tone, tone]
    })
    return dp(
      rows.map((r, j) => (r ? [r.stock, r.asked, r.take, r.asked - r.take * disp.handlers[j].denom] : ['-', '-', '-', '-'])),
      { label: 'the chain, link by link (planning only)', rowLabels: disp.handlers.map((h) => `${h.denom}`), colLabels: ['stock', 'asked', 'takes', 'left'], tones },
    )
  }

  const patch = (o: object, from: string, to: string, methods: string[], reply: (m: string, r: unknown) => string | null): void => {
    const obj = o as Obj
    for (const m of methods) {
      const orig = obj[m].bind(o)
      obj[m] = (...a: unknown[]) => {
        log.push({ from, to, label: `${m}(${a.map(String).join(', ')})` })
        const r = orig(...a)
        const txt = reply(m, r)
        if (txt !== null) log.push({ from: to, to: from, label: txt, dashed: true })
        return r
      }
    }
  }

  const installSpies = (): void => {
    for (const s of [atm.idle, atm.cardIn, atm.authed]) {
      const name = stateName(s)
      const o = s as unknown as Obj
      for (const m of ['insertCard', 'enterPin', 'withdraw', 'balance', 'eject']) {
        const orig = o[m].bind(s)
        o[m] = (...a: unknown[]) => {
          log.push({ from: 'ATM', to: 'State', label: `${name}.${m}(${a.map(String).join(', ')})` })
          return orig(...a)
        }
      }
    }
    patch(bank, 'State', 'Bank', ['usable', 'verify', 'balance', 'check', 'debit'], (m, r) => (m === 'debit' ? null : String(r)))
    patch(disp, 'State', 'Dispenser', ['dispense'], (_m, r) => (r ? fmtNotes(r as Note[]) : 'cannot make it'))
    const origSet = atm.setState.bind(atm)
    atm.setState = (s) => {
      log.push({ from: 'State', to: 'ATM', label: `setState(${stateName(s)})`, tone: 'focus' })
      origSet(s)
    }
    for (const h of disp.handlers) {
      const orig = h.plan.bind(h)
      h.plan = (amount: number, o: Note[]) => {
        const hop: Hop = { denom: h.denom, asked: amount, take: 0, stock: h.stock }
        hops.push(hop)
        const at = o.length
        const ok = orig(amount, o)
        hop.take = o[at]?.denom === h.denom ? o[at].n : 0
        return ok
      }
    }
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    hops = []
    if (op === 'ATM') {
      maxFails = a[2] as number
      limit = a[3] as number
      bank = new Bank(a[0] as [string, string, number][], maxFails, limit)
      disp = new Dispenser(a[1] as [number, number][])
      atm = new ATM(bank, disp)
      installSpies()
      t.step(1, `The machine holds a bank and a dispenser built as a chain of note handlers, ${disp.handlers.map((h) => h.denom).join(' then ')}. It starts in Idle with no card in the slot.`, views())
      out.push(null)
      return
    }

    const before = views()
    const was = nameOf()
    const callText = `${op}(${a.map(String).join(', ')})`
    log.push({ from: 'Client', to: 'ATM', label: callText })
    let result: unknown
    if (op === 'insertCard') result = atm.insertCard(a[0] as string)
    else if (op === 'enterPin') result = atm.enterPin(a[0] as string)
    else if (op === 'withdraw') result = atm.withdraw(a[0] as number)
    else if (op === 'checkBalance') result = atm.checkBalance()
    else result = atm.eject()
    const shown = Array.isArray(result) ? fmtNotes(result as Note[]) : typeof result === 'string' && op === 'withdraw' ? `refused:${result}` : result
    const good = Array.isArray(result) || result === true || result === 'ok' || (op === 'checkBalance' && (result as number) >= 0)
    log.push({ from: 'ATM', to: 'Client', label: String(shown), dashed: true, tone: good ? 'hit' : 'miss' })
    out.push(shown)

    const moved = log.findIndex((x) => x.label.startsWith('setState'))
    const now = nameOf()
    t.step(2, `The ATM does not decide. It forwards ${callText} to the current state object, ${was}.`, [diagram(2), ...before])

    const reachedBank = log.some((x) => x.to === 'Bank')
    const reachedDisp = log.some((x) => x.to === 'Dispenser')
    let what: string
    if (op === 'insertCard') {
      what = result ? `${was} asks the bank whether the card is usable. It is, so the card is taken in.` : was === 'Idle' ? 'The bank says the card is unknown or locked, so Idle does not take it in.' : `${was} already holds a card. Nothing changes.`
    } else if (op === 'enterPin') {
      what = result === 'ok' ? 'The bank checks the PIN and the failure count goes back to zero. The session is signed in.' : result === 'wrong' ? 'The bank counts one more failure. The card stays in and the customer can try again.' : result === 'locked' ? 'That was the last allowed failure. The bank locks the card for good and the machine keeps it.' : `${was} does not take a PIN now. Nothing changes.`
    } else if (op === 'checkBalance') {
      what = reachedBank ? `Signed in, so the state asks the bank: ${result}.` : `${was} will not show a balance before the PIN is right.`
    } else if (op === 'eject') {
      what = result ? `${was} hands the card back and the session ends.` : 'There is no card to give back.'
    } else if (!reachedBank) {
      what = result === 'amount' ? 'The amount must be a whole number of at least 1. Refused before anything else is asked.' : `${was} is not signed in, so money operations are refused. Nothing changes.`
    } else {
      what = reachedDisp ? 'Signed in. The bank says the limit and the balance allow it, so the state moves on to the dispenser.' : `The bank refuses: ${result === 'limit' ? 'this would pass the withdrawal limit' : 'the balance is too low'}. The dispenser is never asked.`
    }
    const dispAt = log.findIndex((x) => x.to === 'Dispenser')
    const stage3Up = reachedDisp ? dispAt : moved >= 0 ? moved : log.length
    t.step(3, what, [diagram(stage3Up), ...(moved >= 0 || reachedDisp ? before : views())])

    if (reachedDisp) {
      const ok = Array.isArray(result)
      t.step(4, ok ? 'The chain plans on paper: each link takes as many of its note as fit and are in stock, then passes the rest on. The remainder reaches 0, so the amount can be made.' : 'The chain plans on paper and runs out of links with money still left. The amount cannot be made, and no stock was touched.', [diagram(ok ? dispAt + 1 : dispAt + 2), chain(!ok), ...before.slice(2)])
      if (ok) t.step(5, `The plan is exact, so the stock goes down by the notes paid out and only then does the bank debit ${a[0]}.`, [diagram(), chain(false), ...views()])
    }
    if (moved >= 0) t.step(6, `The state names the next one: setState(${now}). Same machine and same five methods, now answered by ${now}.`, [diagram(), ...views()])
  })
  return out
}
