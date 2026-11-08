import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import { Inventory, VendingMachine } from './state'

// Replays operations against a real VendingMachine. The state objects and the inventory are patched with
// small spies, so the sequence diagram shows calls that really happened, not a drawing of what should.
const ACTORS = ['Client', 'VendingMachine', 'State', 'Inventory']
const STATES = ['Idle', 'HasMoney', 'SoldOut']
type Obj = Record<string, (...a: unknown[]) => unknown>

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let m!: VendingMachine
  const out: unknown[] = []

  const stateName = (s: unknown): string => (s === m.idle ? 'Idle' : s === m.hasMoney ? 'HasMoney' : 'SoldOut')
  const nameOf = (): string => stateName(m.state)
  const show = (v: unknown): string => (v === null ? 'null' : String(v))

  const views = (): Panel[] => [
    arr(STATES, { label: 'current state (blue = active)', tones: STATES.map((s) => (s === nameOf() ? ('focus' as const) : null)) }),
    buckets(
      [
        { key: 'balance', items: [`${m.balance}c`], tone: m.balance > 0 ? 'keep' : undefined },
        { key: 'change tray', items: [`${m.tray}c`], tone: m.tray > 0 ? 'hit' : undefined },
        ...m.inventory.entries().map(([code, s]) => ({ key: code, items: [s.item.name, `${s.item.price}c`, `x${s.qty}`], tone: s.qty === 0 ? ('miss' as const) : undefined })),
      ],
      { label: 'money and stock (cents)', keyLabel: '' },
    ),
  ]
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })

  const installSpies = (): void => {
    for (const s of [m.idle, m.hasMoney, m.soldOut]) {
      const o = s as unknown as Obj
      for (const method of ['insertCoin', 'selectItem', 'refund', 'restock']) {
        const orig = o[method].bind(s)
        o[method] = (...a: unknown[]) => {
          log.push({ from: 'VendingMachine', to: 'State', label: `${stateName(s)}.${method}(${a.map(String).join(', ')})` })
          return orig(...a)
        }
      }
    }
    const inv = m.inventory as unknown as Obj
    for (const method of ['peek', 'take', 'add', 'total']) {
      const orig = inv[method].bind(m.inventory)
      inv[method] = (...a: unknown[]) => {
        log.push({ from: 'State', to: 'Inventory', label: `${method}(${a.map(String).join(', ')})` })
        const r = orig(...a)
        if (method !== 'take') log.push({ from: 'Inventory', to: 'State', label: method === 'peek' ? (r ? (r as { name: string }).name : 'none') : show(r), dashed: true })
        return r
      }
    }
    const origSet = m.setState.bind(m)
    m.setState = (s) => {
      log.push({ from: 'State', to: 'VendingMachine', label: `setState(${stateName(s)})`, tone: 'focus' })
      origSet(s)
    }
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'VendingMachine') {
      m = new VendingMachine(new Inventory(a[0] as [string, string, number, number][]))
      installSpies()
      t.step(1, `The machine owns the shelves and holds one object per state. It starts in ${nameOf()}${nameOf() === 'SoldOut' ? ' because every slot is empty' : ' because there is stock'}.`, views())
      out.push(null)
      return
    }
    if (op === 'collectChange') {
      log.push({ from: 'Client', to: 'VendingMachine', label: 'collectChange()' })
      const c = m.collectChange()
      log.push({ from: 'VendingMachine', to: 'Client', label: `${c}c`, dashed: true, tone: c > 0 ? 'hit' : undefined })
      t.step(2, c > 0 ? `The tray is emptied: ${c} cents come out. Change is not a state matter, so the machine handles it alone.` : 'The tray is empty, so nothing comes out. Change is not a state matter, so the machine handles it alone.', [diagram(), ...views()])
      out.push(c)
      return
    }

    const before = views()
    const was = nameOf()
    const callText = `${op}(${a.map(String).join(', ')})`
    log.push({ from: 'Client', to: 'VendingMachine', label: callText })
    let result: unknown
    if (op === 'insertCoin') result = m.insertCoin(a[0] as number)
    else if (op === 'selectItem') result = m.selectItem(a[0] as string) ?? -1
    else if (op === 'refund') result = m.refund()
    else result = m.restock(a[0] as string, a[1] as number)
    const failed = result === -1
    log.push({ from: 'VendingMachine', to: 'Client', label: show(result), dashed: true, tone: failed ? 'miss' : 'hit' })
    out.push(result)

    const moved = log.findIndex((x) => x.label.startsWith('setState'))
    const now = nameOf()
    t.step(2, `The machine does not decide. It forwards ${callText} to the current state object, ${was}.`, [diagram(2), ...before])

    let what: string
    let stage = 3
    if (op === 'insertCoin') {
      what = failed ? (was === 'SoldOut' ? 'SoldOut refuses the coin, so nobody pays for nothing. It comes straight back.' : 'A coin must be at least 1 cent. Refused.') : was === 'Idle' ? `Idle accepts the coin. The balance is ${result} cents.` : `HasMoney adds the coin. The balance is now ${result} cents.`
    } else if (op === 'selectItem') {
      if (!failed) {
        stage = 4
        what = `HasMoney sells ${result}: the inventory gives one up and the balance clears. Change waiting in the tray: ${m.tray} cents.`
      } else if (was !== 'HasMoney') {
        what = `${was} cannot sell anything: ${was === 'Idle' ? 'no money has been paid yet' : 'the machine is sold out'}. Nothing changes.`
      } else {
        what = 'HasMoney asked the inventory and could not sell: the slot is unknown, empty, or costs more than the balance. The money stays so the customer can add more or get a refund.'
      }
    } else if (op === 'refund') {
      what = was === 'HasMoney' ? `HasMoney hands back all ${result} cents and clears the balance.` : `${was} has no money to give back, so the refund is 0.`
    } else {
      what = failed ? 'The inventory rejects it: unknown slot or a quantity below 1. Nothing changes.' : `${was} adds the stock. The slot now holds ${result}.`
    }
    t.step(stage, what, [diagram(moved >= 0 ? moved : log.length), ...(moved >= 0 ? before : views())])
    if (moved >= 0) {
      t.step(5, `The state names the next one: setState(${now}). Same machine and same four methods, now answered by ${now}.`, [diagram(), ...views()])
    }
  })
  return out
}
