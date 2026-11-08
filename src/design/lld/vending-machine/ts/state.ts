// Money is always whole cents (integers). A failed operation returns -1 or null and changes nothing.
export interface Item {
  name: string
  price: number // cents
}

export interface Slot {
  item: Item
  qty: number
}

/** The shelves. It knows what is in stock and nothing about money or states. */
export class Inventory {
  private slots = new Map<string, Slot>()

  constructor(rows: [code: string, name: string, price: number, qty: number][]) {
    for (const [code, name, price, qty] of rows) this.slots.set(code, { item: { name, price }, qty })
  }

  entries(): [string, Slot][] {
    return [...this.slots]
  }

  /** The item in that slot, or null if the code is unknown or the slot is empty. */
  peek(code: string): Item | null {
    const s = this.slots.get(code)
    return s && s.qty > 0 ? s.item : null
  }

  take(code: string): void {
    const s = this.slots.get(code)
    if (s && s.qty > 0) s.qty--
  }

  /** New quantity, or -1 for an unknown slot or a quantity below 1. */
  add(code: string, qty: number): number {
    const s = this.slots.get(code)
    if (!s || qty < 1) return -1
    s.qty += qty
    return s.qty
  }

  total(): number {
    let n = 0
    for (const s of this.slots.values()) n += s.qty
    return n
  }
}

/** Every operation the machine supports. Each state answers all of them in its own way. */
export interface State {
  insertCoin(cents: number): number // new balance, or -1 if the coin is refused
  selectItem(code: string): string | null // the item name, or null if nothing was sold
  refund(): number // cents handed back
  restock(code: string, qty: number): number // new quantity, or -1
}

/** The context. It owns the data and forwards every call to whichever state is current. */
export class VendingMachine {
  balance = 0 // cents inserted and not yet spent
  tray = 0 // change waiting to be collected
  readonly idle: State = new Idle(this)
  readonly hasMoney: State = new HasMoney(this)
  readonly soldOut: State = new SoldOut(this)
  state: State

  constructor(readonly inventory: Inventory) {
    this.state = inventory.total() > 0 ? this.idle : this.soldOut // [1] start Idle, or SoldOut if the shelves are empty
  }

  insertCoin(cents: number): number {
    return this.state.insertCoin(cents) // [2] no if/else here: the current state decides
  }
  selectItem(code: string): string | null {
    return this.state.selectItem(code)
  }
  refund(): number {
    return this.state.refund()
  }
  restock(code: string, qty: number): number {
    return this.state.restock(code, qty)
  }

  collectChange(): number {
    const c = this.tray
    this.tray = 0
    return c
  }

  setState(s: State): void {
    this.state = s // [5] a state moves the machine by naming the next state
  }
}

/** No money inside. Waiting for a coin. */
class Idle implements State {
  constructor(private m: VendingMachine) {}

  insertCoin(cents: number): number {
    if (cents < 1) return -1
    this.m.balance = cents // [3] this state accepts the coin and moves on to HasMoney
    this.m.setState(this.m.hasMoney)
    return cents
  }
  selectItem(): string | null {
    return null // pay first
  }
  refund(): number {
    return 0
  }
  restock(code: string, qty: number): number {
    return this.m.inventory.add(code, qty)
  }
}

/** Money is waiting. The customer can add more, pick an item, or ask for it back. */
class HasMoney implements State {
  constructor(private m: VendingMachine) {}

  insertCoin(cents: number): number {
    if (cents < 1) return -1
    this.m.balance += cents
    return this.m.balance
  }
  selectItem(code: string): string | null {
    const item = this.m.inventory.peek(code)
    if (!item || item.price > this.m.balance) return null // unknown, empty, or too expensive: keep the money
    this.m.inventory.take(code) // [4] sell it: take the item, put the difference in the tray, clear the balance
    this.m.tray += this.m.balance - item.price
    this.m.balance = 0
    this.m.setState(this.m.inventory.total() > 0 ? this.m.idle : this.m.soldOut)
    return item.name
  }
  refund(): number {
    const back = this.m.balance
    this.m.balance = 0
    this.m.setState(this.m.idle)
    return back
  }
  restock(code: string, qty: number): number {
    return this.m.inventory.add(code, qty)
  }
}

/** Nothing left to sell. Coins are refused so no one pays for nothing. */
class SoldOut implements State {
  constructor(private m: VendingMachine) {}

  insertCoin(): number {
    return -1
  }
  selectItem(): string | null {
    return null
  }
  refund(): number {
    return 0
  }
  restock(code: string, qty: number): number {
    const n = this.m.inventory.add(code, qty)
    if (n >= 0) this.m.setState(this.m.idle) // stock is back: open for business
    return n
  }
}
