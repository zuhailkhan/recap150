/** All money is integer cents. Percentages round half up: floor((base * pct + 50) / 100). */
export interface Item {
  sku: string
  category: string
  unitCents: number
  qty: number
}

export class Cart {
  readonly items: Item[] = []

  /** Adds a line, or merges into the line with the same sku. Refuses a non-positive qty or a negative price. */
  add(sku: string, category: string, unitCents: number, qty: number): boolean {
    if (qty <= 0 || unitCents < 0) return false
    const line = this.items.find((i) => i.sku === sku)
    if (line) line.qty += qty // [1] the same sku is one line
    else this.items.push({ sku, category, unitCents, qty })
    return true
  }

  subtotal(): number {
    return this.items.reduce((sum, i) => sum + i.unitCents * i.qty, 0)
  }

  subtotalOf(category: string): number {
    return this.items.filter((i) => i.category === category).reduce((sum, i) => sum + i.unitCents * i.qty, 0)
  }
}

/** Specification: one yes/no eligibility test. Its name is the reason shown when it says no. */
export interface Spec {
  readonly name: string
  ok(cart: Cart, today: number): boolean
}
export class MinCart implements Spec {
  readonly name = 'below minimum'
  constructor(private minCents: number) {}
  ok(cart: Cart) {
    return cart.subtotal() >= this.minCents
  }
}
export class NotExpired implements Spec {
  readonly name = 'expired'
  constructor(private lastDay: number) {} // the last day the coupon works, inclusive
  ok(_: Cart, today: number) {
    return today <= this.lastDay
  }
}
export class HasCategory implements Spec {
  readonly name = 'no matching category'
  constructor(private category: string) {}
  ok(cart: Cart) {
    return cart.items.some((i) => i.category === this.category)
  }
}
export class UnderLimit implements Spec {
  readonly name = 'limit reached'
  constructor(private code: string, private max: number, private usage: Usage) {}
  ok() {
    return this.usage.used(this.code) < this.max
  }
}

/** How many times each code was redeemed at checkout. */
export class Usage {
  private counts = new Map<string, number>()
  used(code: string): number {
    return this.counts.get(code) ?? 0
  }
  redeem(code: string): void {
    this.counts.set(code, this.used(code) + 1)
  }
}

/** Strategy: how much a coupon takes off. payable is what is still left to pay. */
export interface DiscountStrategy {
  amount(cart: Cart, payable: number): number
}
export class PercentOff implements DiscountStrategy {
  constructor(private pct: number, private category?: string) {}
  amount(cart: Cart, payable: number) {
    const base = this.category ? Math.min(cart.subtotalOf(this.category), payable) : payable
    return Math.floor((base * this.pct + 50) / 100)
  }
}
export class FlatOff implements DiscountStrategy {
  constructor(private cents: number) {}
  amount() {
    return this.cents
  }
}
/** Buy x of a sku, get y of them free: every full group of x + y units has y free. */
export class BuyXGetY implements DiscountStrategy {
  constructor(private sku: string, private x: number, private y: number) {}
  amount(cart: Cart) {
    const line = cart.items.find((i) => i.sku === this.sku)
    return line ? Math.floor(line.qty / (this.x + this.y)) * this.y * line.unitCents : 0
  }
}

export interface Coupon {
  code: string
  priority: number // lower goes first
  specs: Spec[] // all must hold, checked in this order
  strategy: DiscountStrategy
}
export interface Applied {
  code: string
  cents: number
}

const byPriority = (a: Coupon, b: Coupon) => a.priority - b.priority || (a.code < b.code ? -1 : 1)

/** Stacking policy: given the eligible coupons, decide which apply and for how much. */
export interface StackingPolicy {
  choose(coupons: Coupon[], cart: Cart): Applied[]
}

/** Only the single biggest saving applies. A tie goes to the lower priority number. */
export class BestSingle implements StackingPolicy {
  choose(coupons: Coupon[], cart: Cart): Applied[] {
    const subtotal = cart.subtotal()
    let best: Applied | undefined
    for (const c of [...coupons].sort(byPriority)) {
      const cents = Math.min(c.strategy.amount(cart, subtotal), subtotal) // [3] price each coupon on its own
      if (cents > 0 && (!best || cents > best.cents)) best = { code: c.code, cents } // [4] strictly bigger wins
    }
    return best ? [best] : []
  }
}

/** Every eligible coupon applies, in priority order, each on what is still payable, up to capPercent of the subtotal. */
export class StackInOrder implements StackingPolicy {
  constructor(private capPercent: number) {}

  choose(coupons: Coupon[], cart: Cart): Applied[] {
    let payable = cart.subtotal()
    let allowance = Math.floor((payable * this.capPercent) / 100) // the most all coupons together may take
    const applied: Applied[] = []
    for (const c of [...coupons].sort(byPriority)) { // [4] fixed priority order
      const asked = c.strategy.amount(cart, payable) // [3] price it on the running total
      const cents = Math.min(asked, payable, allowance) // [5] never below zero, never over the cap
      if (cents <= 0) continue
      applied.push({ code: c.code, cents })
      payable -= cents
      allowance -= cents
    }
    return applied
  }
}

export interface Quote {
  total: number
  applied: Applied[]
  rejected: string[] // "CODE:reason", in the order the codes were given
}

export class CouponEngine {
  private catalog: Map<string, Coupon>

  constructor(coupons: Coupon[], private policy: StackingPolicy, private usage: Usage) {
    this.catalog = new Map(coupons.map((c) => [c.code, c]))
  }

  quote(cart: Cart, codes: string[], today: number): Quote {
    const eligible: Coupon[] = []
    const rejected: string[] = []
    const seen = new Set<string>()
    for (const code of codes) {
      const coupon = this.catalog.get(code)
      if (!coupon) rejected.push(`${code}:unknown`)
      else if (seen.has(code)) rejected.push(`${code}:duplicate`)
      else {
        const failed = coupon.specs.find((s) => !s.ok(cart, today)) // [2] first failing spec is the reason
        if (failed) rejected.push(`${code}:${failed.name}`)
        else eligible.push(coupon)
      }
      seen.add(code)
    }
    const applied = this.policy.choose(eligible, cart)
    const off = applied.reduce((sum, a) => sum + a.cents, 0)
    return { total: cart.subtotal() - off, applied, rejected }
  }

  /** Same as quote, then counts one use for every coupon that really took something off. */
  checkout(cart: Cart, codes: string[], today: number): Quote {
    const q = this.quote(cart, codes, today)
    for (const a of q.applied) this.usage.redeem(a.code) // [6] only applied coupons are used up
    return q
  }
}
