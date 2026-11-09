// Money is whole currency units (integers). A refused operation changes nothing.
export interface Note {
  denom: number
  n: number
}
export type Verdict = 'ok' | 'wrong' | 'locked'
export type Refusal = 'state' | 'amount' | 'limit' | 'funds' | 'cash'

interface Account {
  pin: string
  balance: number
  fails: number
  withdrawn: number
  locked: boolean
}

/** The bank: PINs, balances, the failure count and the withdrawal limit. It knows nothing about notes. */
export class Bank {
  readonly accounts = new Map<string, Account>()

  constructor(rows: [card: string, pin: string, balance: number][], private maxFails: number, private limit: number) {
    for (const [card, pin, balance] of rows) this.accounts.set(card, { pin, balance, fails: 0, withdrawn: 0, locked: false })
  }

  usable(card: string): boolean {
    const a = this.accounts.get(card)
    return !!a && !a.locked
  }

  /** The lockout lives here, not in the session, so pulling the card out and putting it back does not reset it. */
  verify(card: string, pin: string): Verdict {
    const a = this.accounts.get(card)
    if (!a || a.locked) return 'locked'
    if (a.pin === pin) {
      a.fails = 0
      return 'ok'
    }
    a.locked = ++a.fails >= this.maxFails
    return a.locked ? 'locked' : 'wrong'
  }

  balance(card: string): number {
    return this.accounts.get(card)?.balance ?? -1
  }

  /** 'ok', or why this much cannot be taken. */
  check(card: string, amount: number): 'ok' | 'limit' | 'funds' {
    const a = this.accounts.get(card)!
    if (a.withdrawn + amount > this.limit) return 'limit'
    return amount > a.balance ? 'funds' : 'ok'
  }

  debit(card: string, amount: number): void {
    const a = this.accounts.get(card)!
    a.balance -= amount
    a.withdrawn += amount
  }
}

/** One link in the chain: one denomination. It takes what it can and hands the rest to the next link. */
class NoteHandler {
  next: NoteHandler | null = null

  constructor(readonly denom: number, public stock: number) {}

  /** Plans only. It records what it would take in `out` and never touches the stock. True if the whole amount can be made. */
  plan(amount: number, out: Note[]): boolean {
    const n = Math.min(Math.floor(amount / this.denom), this.stock) // [4] as many of my note as fit and are in stock
    if (n > 0) out.push({ denom: this.denom, n })
    const rest = amount - n * this.denom
    return rest === 0 || (this.next !== null && this.next.plan(rest, out)) // pass the rest down the chain
  }
}

/** Builds the chain from `stock`, highest denomination first, and pays out. */
export class Dispenser {
  readonly handlers: NoteHandler[]

  constructor(stock: [denom: number, count: number][]) {
    this.handlers = stock.map(([d, c]) => new NoteHandler(d, c))
    this.handlers.forEach((h, i) => (h.next = this.handlers[i + 1] ?? null))
  }

  /** The notes paid out, or null if the amount cannot be made. On null nothing has changed. */
  dispense(amount: number): Note[] | null {
    const plan: Note[] = []
    if (!this.handlers[0]?.plan(amount, plan)) return null
    for (const { denom, n } of plan) this.handlers.find((h) => h.denom === denom)!.stock -= n // [5] the plan worked: now take the notes
    return plan
  }
}

/** Every operation the machine supports. Each state answers all of them in its own way. */
export interface State {
  insertCard(card: string): boolean // true if the card was taken in
  enterPin(pin: string): Verdict | 'refused'
  withdraw(amount: number): Note[] | Refusal
  balance(): number // -1 unless signed in
  eject(): boolean // true if a card was handed back
}

/** The context. It owns the session and forwards every call to whichever state is current. */
export class ATM {
  card = '' // the card in the slot, '' if none
  readonly idle: State = new Idle(this)
  readonly cardIn: State = new CardInserted(this)
  readonly authed: State = new Authenticated(this)
  state: State = this.idle // [1] a machine with no card in it

  constructor(readonly bank: Bank, readonly dispenser: Dispenser) {}

  insertCard(card: string): boolean {
    return this.state.insertCard(card) // [2] no if/else here: the current state decides
  }
  enterPin(pin: string): Verdict | 'refused' {
    return this.state.enterPin(pin)
  }
  withdraw(amount: number): Note[] | Refusal {
    return this.state.withdraw(amount)
  }
  checkBalance(): number {
    return this.state.balance()
  }
  eject(): boolean {
    return this.state.eject()
  }

  setState(s: State): void {
    this.state = s // [6] a state moves the machine by naming the next state
  }
}

/** No card. Waiting for one. */
class Idle implements State {
  constructor(private m: ATM) {}

  insertCard(card: string): boolean {
    if (!this.m.bank.usable(card)) return false // unknown or locked card
    this.m.card = card
    this.m.setState(this.m.cardIn)
    return true
  }
  enterPin(): 'refused' {
    return 'refused'
  }
  withdraw(): Refusal {
    return 'state'
  }
  balance(): number {
    return -1
  }
  eject(): boolean {
    return false
  }
}

/** A card is in, the PIN is not yet right. */
class CardInserted implements State {
  constructor(private m: ATM) {}

  insertCard(): boolean {
    return false
  }
  enterPin(pin: string): Verdict {
    const v = this.m.bank.verify(this.m.card, pin) // [3] the bank counts the failures and does the lockout
    if (v === 'ok') this.m.setState(this.m.authed)
    if (v === 'locked') this.end() // the machine keeps the card
    return v
  }
  withdraw(): Refusal {
    return 'state'
  }
  balance(): number {
    return -1
  }
  eject(): boolean {
    this.end()
    return true
  }
  private end(): void {
    this.m.card = ''
    this.m.setState(this.m.idle)
  }
}

/** Signed in. Money operations are allowed. */
class Authenticated implements State {
  constructor(private m: ATM) {}

  insertCard(): boolean {
    return false
  }
  enterPin(): 'refused' {
    return 'refused'
  }
  withdraw(amount: number): Note[] | Refusal {
    const { bank, dispenser, card } = this.m
    if (!Number.isInteger(amount) || amount < 1) return 'amount'
    const why = bank.check(card, amount) // account rules first: limit and balance
    if (why !== 'ok') return why
    const notes = dispenser.dispense(amount) // then the chain: can the cash be made?
    if (!notes) return 'cash'
    bank.debit(card, amount) // debit only after the notes are out
    return notes
  }
  balance(): number {
    return this.m.bank.balance(this.m.card)
  }
  eject(): boolean {
    this.m.card = ''
    this.m.setState(this.m.idle)
    return true
  }
}
