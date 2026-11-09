// Money is whole paise (100 paise = 1 rupee). A refused operation returns false, 0, -1 or "none" and changes nothing.
export interface Point {
  x: number
  y: number
}
export const manhattan = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

export interface Line {
  itemId: string
  name: string
  price: number // paise per unit, copied from the menu when the order is placed
  qty: number
}

export interface MenuItem {
  name: string
  price: number
  stock: number
}

export class Restaurant {
  menu = new Map<string, MenuItem>()
  constructor(readonly id: string, readonly at: Point, items: [itemId: string, name: string, price: number, stock: number][]) {
    for (const [itemId, name, price, stock] of items) this.menu.set(itemId, { name, price, stock })
  }

  /** All or nothing: take every line from stock, or take nothing. */
  reserve(lines: Line[]): boolean {
    if (lines.some((l) => (this.menu.get(l.itemId)?.stock ?? 0) < l.qty)) return false
    for (const l of lines) this.menu.get(l.itemId)!.stock -= l.qty
    return true
  }

  release(lines: Line[]): void {
    for (const l of lines) this.menu.get(l.itemId)!.stock += l.qty
  }
}

/** One customer's cart. It is bound to a single restaurant while it holds anything. */
export class Cart {
  restaurantId = ''
  private qty = new Map<string, number>() // itemId -> quantity, in the order first added

  add(restaurantId: string, itemId: string, n: number): boolean {
    if (this.qty.size > 0 && this.restaurantId !== restaurantId) return false // [1] one restaurant at a time
    this.restaurantId = restaurantId
    this.qty.set(itemId, (this.qty.get(itemId) ?? 0) + n)
    return true
  }

  remove(itemId: string): boolean {
    const had = this.qty.delete(itemId)
    if (this.qty.size === 0) this.restaurantId = '' // an empty cart belongs to no one, so the next item can pick any restaurant
    return had
  }

  count(itemId: string): number {
    return this.qty.get(itemId) ?? 0
  }

  items(): [string, number][] {
    return [...this.qty]
  }

  clear(): void {
    this.qty.clear()
    this.restaurantId = ''
  }
}

export interface Bill {
  subtotal: number
  discount: number
  tax: number
  delivery: number
  total: number
}

/** One step of pricing. It reads what earlier steps wrote and fills in its own field. */
export interface PriceRule {
  apply(b: Bill, lines: Line[]): void
}

export class ItemTotals implements PriceRule {
  apply(b: Bill, lines: Line[]): void {
    b.subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  }
}

/** percent off the subtotal once it reaches minSubtotal, never more than cap. */
export class PercentDiscount implements PriceRule {
  constructor(private percent: number, private minSubtotal: number, private cap: number) {}
  apply(b: Bill): void {
    if (b.subtotal >= this.minSubtotal) b.discount = Math.min(Math.floor((b.subtotal * this.percent) / 100), this.cap)
  }
}

/** Tax is charged on what the customer actually pays for food, so after the discount. Rounded half up. */
export class Tax implements PriceRule {
  constructor(private percent: number) {}
  apply(b: Bill): void {
    b.tax = Math.floor(((b.subtotal - b.discount) * this.percent + 50) / 100)
  }
}

/** A flat fee, waived when the food total after discount reaches freeAbove. Not taxed. */
export class DeliveryFee implements PriceRule {
  constructor(private fee: number, private freeAbove: number) {}
  apply(b: Bill): void {
    b.delivery = b.subtotal - b.discount >= this.freeAbove ? 0 : this.fee
  }
}

export type OrderState = 'Placed' | 'Accepted' | 'Preparing' | 'PickedUp' | 'Delivered' | 'Cancelled'

/** The only legal moves. Once food is being prepared the order can no longer be cancelled. */
const NEXT: Record<OrderState, OrderState[]> = {
  Placed: ['Accepted', 'Cancelled'],
  Accepted: ['Preparing', 'Cancelled'],
  Preparing: ['PickedUp'],
  PickedUp: ['Delivered'],
  Delivered: [],
  Cancelled: [],
}

export class Order {
  state: OrderState = 'Placed'
  partnerId = ''
  constructor(readonly id: number, readonly restaurantId: string, readonly lines: Line[], readonly bill: Bill, readonly drop: Point) {}

  can(next: OrderState): boolean {
    return NEXT[this.state].includes(next)
  }

  move(next: OrderState): boolean {
    if (!this.can(next)) return false
    this.state = next
    return true
  }
}

export class Partner {
  delivered = 0
  constructor(readonly id: string, public at: Point, public busy = false) {}
}

/** Chooses a free delivery partner for a restaurant. Returns null when everyone is busy. */
export interface AssignStrategy {
  pick(partners: Partner[], restaurant: Point): Partner | null
}

/** Closest free partner to the restaurant. Ties go to the smaller id. */
export class NearestPartner implements AssignStrategy {
  pick(partners: Partner[], restaurant: Point): Partner | null {
    let best: Partner | null = null
    let bestDist = 0
    for (const p of partners) {
      if (p.busy) continue
      const d = manhattan(p.at, restaurant)
      if (!best || d < bestDist || (d === bestDist && p.id < best.id)) {
        best = p
        bestDist = d
      }
    }
    return best
  }
}

/** The free partner with the fewest deliveries so far, to spread the work. Ties go to the smaller id. */
export class LeastDelivered implements AssignStrategy {
  pick(partners: Partner[]): Partner | null {
    let best: Partner | null = null
    for (const p of partners) {
      if (p.busy) continue
      if (!best || p.delivered < best.delivered || (p.delivered === best.delivered && p.id < best.id)) best = p
    }
    return best
  }
}

export class FoodService {
  private restaurants = new Map<string, Restaurant>()
  private carts = new Map<string, Cart>()
  private orders: Order[] = [] // order id n is orders[n - 1]

  constructor(restaurants: Restaurant[], private partners: Partner[], private rules: PriceRule[], private assign: AssignStrategy) {
    for (const r of restaurants) this.restaurants.set(r.id, r)
  }

  /** The quantity of that item now in the cart, or -1 if refused. */
  addToCart(user: string, restaurantId: string, itemId: string, qty: number): number {
    if (qty < 1 || !this.restaurants.get(restaurantId)?.menu.has(itemId)) return -1
    const cart = this.cartOf(user)
    return cart.add(restaurantId, itemId, qty) ? cart.count(itemId) : -1
  }

  removeFromCart(user: string, itemId: string): boolean {
    return this.cartOf(user).remove(itemId)
  }

  /** subtotal, discount, tax, delivery, total for the cart as it stands. Empty cart gives an empty list. */
  bill(user: string): number[] {
    const cart = this.cartOf(user)
    if (cart.items().length === 0) return []
    const b = this.price(this.linesOf(cart))
    return [b.subtotal, b.discount, b.tax, b.delivery, b.total]
  }

  /** The order id, or -1 if the cart is empty or the restaurant cannot fill every line. */
  placeOrder(user: string, drop: Point): number {
    const cart = this.cartOf(user)
    if (cart.items().length === 0) return -1
    const lines = this.linesOf(cart)
    if (!this.restaurants.get(cart.restaurantId)!.reserve(lines)) return -1 // [3] take all the stock or none, so nothing oversells
    const order = new Order(this.orders.length + 1, cart.restaurantId, lines, this.price(lines), drop) // the price is fixed from here on
    this.orders.push(order)
    cart.clear()
    return order.id
  }

  /** The restaurant accepts and a partner is assigned. Refused if no partner is free. */
  accept(id: number): boolean {
    const order = this.orders[id - 1]
    if (!order || !order.can('Accepted')) return false
    const partner = this.assign.pick(this.partners, this.restaurants.get(order.restaurantId)!.at) // [4] ask the strategy, then claim the partner
    if (!partner) return false
    order.move('Accepted')
    order.partnerId = partner.id
    partner.busy = true
    return true
  }

  startPreparing(id: number): boolean {
    return this.orders[id - 1]?.move('Preparing') ?? false
  }

  pickUp(id: number): boolean {
    return this.orders[id - 1]?.move('PickedUp') ?? false
  }

  deliver(id: number): boolean {
    const order = this.orders[id - 1]
    if (!order || !order.move('Delivered')) return false
    const p = this.partnerOf(order)
    p.busy = false // [5] the partner is free at the customer's door
    p.at = order.drop
    p.delivered++
    return true
  }

  /** The refund in paise, or -1 if the order is already being prepared, or is finished. */
  cancel(id: number): number {
    const order = this.orders[id - 1]
    if (!order || !order.move('Cancelled')) return -1
    this.restaurants.get(order.restaurantId)!.release(order.lines) // [5] the food goes back on the shelf
    if (order.partnerId) {
      this.partnerOf(order).busy = false
      order.partnerId = ''
    }
    return order.bill.total
  }

  /** "Accepted:p1", "Placed", or "none". */
  status(id: number): string {
    const o = this.orders[id - 1]
    return o ? o.state + (o.partnerId ? ':' + o.partnerId : '') : 'none'
  }

  stock(restaurantId: string, itemId: string): number {
    return this.restaurants.get(restaurantId)?.menu.get(itemId)?.stock ?? -1
  }

  private partnerOf(o: Order): Partner {
    return this.partners.find((p) => p.id === o.partnerId)!
  }

  private cartOf(user: string): Cart {
    let c = this.carts.get(user)
    if (!c) this.carts.set(user, (c = new Cart()))
    return c
  }

  private linesOf(cart: Cart): Line[] {
    const menu = this.restaurants.get(cart.restaurantId)!.menu
    return cart.items().map(([itemId, qty]) => ({ itemId, name: menu.get(itemId)!.name, price: menu.get(itemId)!.price, qty }))
  }

  /** Run every rule in order, then add up. The order of the rules is part of the price. */
  private price(lines: Line[]): Bill {
    const b: Bill = { subtotal: 0, discount: 0, tax: 0, delivery: 0, total: 0 }
    for (const rule of this.rules) rule.apply(b, lines) // [2] a pipeline: each rule fills in its own field
    b.total = b.subtotal - b.discount + b.tax + b.delivery
    return b
  }
}
