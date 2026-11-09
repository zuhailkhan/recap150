// Money is whole cents. A refused operation returns 0, -1 or "none" and changes nothing.
export interface Product {
  name: string
  price: number // cents
}

/** What the customer is buying: the price is copied from the catalog at checkout. */
export interface Line {
  sku: string
  qty: number
  price: number
}

export class Cart {
  private qty = new Map<string, number>() // sku -> quantity, in the order first added

  add(sku: string, n: number): number {
    const total = (this.qty.get(sku) ?? 0) + n
    this.qty.set(sku, total)
    return total
  }
  remove(sku: string): boolean {
    return this.qty.delete(sku)
  }
  entries(): [string, number][] {
    return [...this.qty]
  }
  clear(): void {
    this.qty.clear()
  }
}

/** Units on the shelf and units promised to someone who has not paid yet. */
export class Inventory {
  private stock = new Map<string, { onHand: number; reserved: number }>()
  private holds = new Map<number, Line[]>()
  private nextHold = 1

  constructor(rows: [sku: string, onHand: number][]) {
    for (const [sku, onHand] of rows) this.stock.set(sku, { onHand, reserved: 0 })
  }

  available(sku: string): number {
    const s = this.stock.get(sku)
    return s ? s.onHand - s.reserved : 0
  }

  /** All or nothing. Returns a hold id, or 0 if any line is short. The units stay on hand, but nobody else can reserve them. */
  reserve(lines: Line[]): number {
    if (lines.some((l) => this.available(l.sku) < l.qty)) return 0
    for (const l of lines) this.stock.get(l.sku)!.reserved += l.qty
    this.holds.set(this.nextHold, lines)
    return this.nextHold++
  }

  /** Payment succeeded: the held units are sold. */
  confirm(hold: number): void {
    for (const l of this.holds.get(hold) ?? []) {
      const s = this.stock.get(l.sku)!
      s.onHand -= l.qty
      s.reserved -= l.qty
    }
    this.holds.delete(hold)
  }

  /** Payment failed or checkout was abandoned: the held units are for sale again. */
  release(hold: number): void {
    for (const l of this.holds.get(hold) ?? []) this.stock.get(l.sku)!.reserved -= l.qty
    this.holds.delete(hold)
  }

  /** Sold units come back, after a refund. */
  restock(lines: Line[]): void {
    for (const l of lines) this.stock.get(l.sku)!.onHand += l.qty
  }

  /** [on hand, reserved], or null for an unknown sku. */
  levels(sku: string): [number, number] | null {
    const s = this.stock.get(sku)
    return s ? [s.onHand, s.reserved] : null
  }
}

/** One way to pay. The shop knows nothing about limits or balances. */
export interface PaymentStrategy {
  charge(cents: number): boolean
  refund(cents: number): void
}

/** Approves anything up to its limit. Refunds go back to the card, outside this model. */
export class CardPayment implements PaymentStrategy {
  constructor(private limit: number) {}
  charge(cents: number): boolean {
    return cents <= this.limit
  }
  refund(): void {}
}

export class WalletPayment implements PaymentStrategy {
  constructor(public balance: number) {}
  charge(cents: number): boolean {
    if (cents > this.balance) return false
    this.balance -= cents
    return true
  }
  refund(cents: number): void {
    this.balance += cents
  }
}

export type OrderState = 'Pending' | 'Paid' | 'PaymentFailed' | 'Cancelled'

export class Order {
  state: OrderState = 'Pending'
  method = '' // how it was paid, once it is paid
  constructor(readonly id: number, readonly user: string, readonly lines: Line[], readonly total: number, readonly hold: number) {}
}

export class Shop {
  private carts = new Map<string, Cart>()
  private orders: Order[] = [] // order id n is orders[n - 1]

  constructor(
    private catalog: Map<string, Product>,
    private inventory: Inventory,
    private customers: Map<string, Record<string, PaymentStrategy>>,
  ) {}

  /** The quantity of that product now in the cart, or -1. Nothing is reserved yet. */
  addToCart(user: string, sku: string, qty: number): number {
    if (qty < 1 || !this.customers.has(user) || !this.catalog.has(sku)) return -1
    return this.cartOf(user).add(sku, qty) // [1] a cart is only a wish list, so stock is not touched
  }

  removeFromCart(user: string, sku: string): boolean {
    return this.cartOf(user).remove(sku)
  }

  cartTotal(user: string): number {
    return this.total(this.linesOf(this.cartOf(user)))
  }

  /** The order id, or 0 if the cart is empty or any line is short. The cart moves into a Pending order. */
  checkout(user: string): number {
    const cart = this.cartOf(user)
    const lines = this.linesOf(cart)
    if (lines.length === 0) return 0
    const hold = this.inventory.reserve(lines) // [2] hold every line or none, so two buyers cannot both get the last unit
    if (hold === 0) return 0
    cart.clear()
    const order = new Order(this.orders.length + 1, user, lines, this.total(lines), hold)
    this.orders.push(order)
    return order.id
  }

  /** 1 paid, 0 declined, -1 not payable (unknown order, not Pending, or unknown method). */
  pay(orderId: number, method: string): number {
    const order = this.orders[orderId - 1]
    const how = order && this.customers.get(order.user)?.[method]
    if (!order || order.state !== 'Pending' || !how) return -1
    if (!how.charge(order.total)) { // [3] ask the strategy. Card or wallet, the shop cannot tell
      this.inventory.release(order.hold) // [5] declined: the units go back on sale
      this.refill(order)
      order.state = 'PaymentFailed'
      return 0
    }
    this.inventory.confirm(order.hold) // [4] paid: the held units become sold
    order.state = 'Paid'
    order.method = method
    return 1
  }

  /** Cents refunded, or -1 if the order cannot be cancelled. A Pending order refunds 0. */
  cancel(orderId: number): number {
    const order = this.orders[orderId - 1]
    if (order?.state === 'Pending') {
      this.inventory.release(order.hold) // [5] abandoned checkout: free the hold
      this.refill(order)
      order.state = 'Cancelled'
      return 0
    }
    if (order?.state === 'Paid') {
      this.customers.get(order.user)![order.method].refund(order.total)
      this.inventory.restock(order.lines)
      order.state = 'Cancelled'
      return order.total
    }
    return -1
  }

  status(orderId: number): string {
    return this.orders[orderId - 1]?.state ?? 'none'
  }

  /** [on hand, reserved], or an empty list for an unknown sku. */
  stock(sku: string): number[] {
    return this.inventory.levels(sku) ?? []
  }

  /** A failed or abandoned order puts its items back in the cart. */
  private refill(order: Order): void {
    const cart = this.cartOf(order.user)
    for (const l of order.lines) cart.add(l.sku, l.qty)
  }

  private cartOf(user: string): Cart {
    let c = this.carts.get(user)
    if (!c) this.carts.set(user, (c = new Cart()))
    return c
  }

  private linesOf(cart: Cart): Line[] {
    return cart.entries().map(([sku, qty]) => ({ sku, qty, price: this.catalog.get(sku)!.price }))
  }

  private total(lines: Line[]): number {
    return lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  }
}
