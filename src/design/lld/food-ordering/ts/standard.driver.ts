import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Panel, type SeqMessage, type Tone } from '../../../../core/panels'
import {
  Cart, DeliveryFee, FoodService, ItemTotals, LeastDelivered, NearestPartner, Order, Partner, PercentDiscount, Restaurant, Tax,
  manhattan, type AssignStrategy, type Bill, type OrderState, type PriceRule,
} from './standard'

// Replays operations against a real FoodService. The rules and the assign strategy are wrapped in spies, and Cart,
// Restaurant and Order methods are patched for the run, so the sequence diagram shows calls that really happened.
const CANON = ['Caller', 'FoodService', 'Cart', 'PriceRule', 'Restaurant', 'Order', 'Assign']
const paise = (n: number): string => `${n}`
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const marks = { reserve: 0, rules: 0, pick: 0 } // log lengths after the reserve reply, the last rule reply, the pick reply
  let svc!: FoodService
  let restaurants: Restaurant[] = []
  let partners: Partner[] = []
  let strategyName = 'nearest'
  let inMove = false
  const out: unknown[] = []

  const ruleSpy = (inner: PriceRule): PriceRule => ({
    apply(b: Bill, lines) {
      const name = inner.constructor.name
      log.push({ from: 'FoodService', to: 'PriceRule', label: name })
      inner.apply(b, lines)
      const shown = name === 'ItemTotals' ? `subtotal ${paise(b.subtotal)}` : name === 'PercentDiscount' ? `discount ${paise(b.discount)}` : name === 'Tax' ? `tax ${paise(b.tax)}` : `delivery ${paise(b.delivery)}`
      log.push({ from: 'PriceRule', to: 'FoodService', label: shown, dashed: true, tone: 'focus' })
      marks.rules = log.length
    },
  })
  const assignSpy = (inner: AssignStrategy): AssignStrategy => ({
    pick(list, at) {
      log.push({ from: 'FoodService', to: 'Assign', label: `pick(restaurant ${at.x},${at.y})` })
      const p = inner.pick(list, at)
      log.push({ from: 'Assign', to: 'FoodService', label: p ? `${p.id}${strategyName === 'nearest' ? `, ${manhattan(p.at, at)} away` : `, ${p.delivered} done`}` : 'nobody free', dashed: true, tone: p ? 'focus' : 'miss' })
      marks.pick = log.length
      return p
    },
  })

  const cartsOf = (): Map<string, Cart> => svc['carts']
  const ordersOf = (): Order[] => svc['orders']

  const stockPanel = (hot?: string): Panel =>
    buckets(restaurants.flatMap((r) => [...r.menu].map(([id, m]) => ({ key: `${r.id} ${m.name}`, items: [`${m.stock} left`], tone: (m.stock === 0 ? 'miss' : hot === id ? 'focus' : undefined) as Tone | undefined }))), { label: 'stock per restaurant and dish', keyLabel: 'dish' })
  const cartPanel = (user?: string): Panel =>
    buckets([...cartsOf()].filter(([, c]) => c.items().length > 0).map(([u, c]) => {
      const menu = restaurants.find((r) => r.id === c.restaurantId)!.menu
      return { key: u, items: [c.restaurantId, ...c.items().map(([id, q]) => `${menu.get(id)!.name} x${q}`)], tone: (u === user ? 'focus' : 'keep') as Tone }
    }), { label: 'carts: restaurant, then items', keyLabel: 'customer', empty: 'all carts are empty' })
  const billPanel = (b: number[]): Panel =>
    buckets(['subtotal', 'discount', 'tax', 'delivery', 'total'].map((k, i) => ({ key: k, items: [`${b[i] ?? 0}`], tone: (k === 'total' ? 'hit' : undefined) as Tone | undefined })), { label: 'bill in paise, built by the rules in order', keyLabel: '' })
  const ordersPanel = (hot?: number): Panel =>
    buckets(ordersOf().map((o) => ({
      key: `order ${o.id}`, items: [o.state, o.partnerId || 'no partner', `${o.bill.total} paise`],
      tone: (o.id === hot ? 'focus' : o.state === 'Cancelled' ? 'miss' : o.state === 'Delivered' ? 'dim' : 'keep') as Tone,
    })), { label: 'orders: state, partner, total', keyLabel: 'order', empty: 'no orders yet' })
  const partnersPanel = (): Panel =>
    arr(partners.map((p) => `${p.id} (${p.at.x},${p.at.y}) ${p.busy ? 'busy' : 'free'}, ${p.delivered} done`), { label: 'delivery partners, blue = busy', tones: partners.map((p) => (p.busy ? ('keep' as const) : ('hit' as const))) })
  const diagram = (upTo = log.length): Panel => {
    const used = new Set(log.flatMap((m) => [m.from, m.to]))
    return seq(CANON.filter((a) => used.has(a)), log.slice(0, upTo), { label: 'calls in this request' })
  }
  const reply = (label: string, ok: boolean) => log.push({ from: 'FoodService', to: 'Caller', label, dashed: true, tone: ok ? 'hit' : 'miss' })
  const stateOf = (id: number): string => svc.status(id).split(':')[0]

  const patched: [object, string, unknown][] = []
  const patch = (proto: object, name: string, to: string, label: (a: unknown[]) => string, answer: (r: unknown) => string, tone: (r: unknown) => Tone) => {
    const orig = (proto as Record<string, (...a: unknown[]) => unknown>)[name]
    patched.push([proto, name, orig])
    ;(proto as Record<string, unknown>)[name] = function (this: unknown, ...a: unknown[]) {
      if (inMove) return orig.apply(this, a)
      log.push({ from: 'FoodService', to, label: label(a) })
      if (name === 'move') inMove = true
      const r = orig.apply(this, a)
      inMove = false
      if (name === 'reserve') marks.reserve = log.length + 1
      log.push({ from: to, to: 'FoodService', label: answer(r), dashed: true, tone: tone(r) })
      return r
    }
  }
  patch(Cart.prototype, 'add', 'Cart', (a) => `add(${a[0]}, ${a[1]}, ${a[2]})`, (r) => (r ? 'added' : 'other restaurant'), (r) => (r ? 'hit' : 'miss'))
  patch(Cart.prototype, 'remove', 'Cart', (a) => `remove(${a[0]})`, (r) => (r ? 'removed' : 'not there'), (r) => (r ? 'hit' : 'miss'))
  patch(Cart.prototype, 'clear', 'Cart', () => 'clear()', () => 'empty', () => 'hit')
  patch(Restaurant.prototype, 'reserve', 'Restaurant', (a) => `reserve(${(a[0] as { itemId: string; qty: number }[]).map((l) => `${l.itemId}x${l.qty}`).join(', ')})`, (r) => (r ? 'taken' : 'not enough stock'), (r) => (r ? 'hit' : 'miss'))
  patch(Restaurant.prototype, 'release', 'Restaurant', () => 'release(lines)', () => 'back on shelf', () => 'hit')
  patch(Order.prototype, 'can', 'Order', (a) => `can(${a[0]})`, (r) => (r ? 'yes' : 'no'), (r) => (r ? 'hit' : 'miss'))
  patch(Order.prototype, 'move', 'Order', (a) => `move(${a[0]})`, (r) => (r ? 'moved' : 'refused'), (r) => (r ? 'hit' : 'miss'))

  try {
    ops.forEach((op, i) => {
      const a = args[i]
      log.length = 0
      marks.reserve = marks.rules = marks.pick = 0
      if (op === 'FoodService') {
        restaurants = (a[0] as [string, number, number, [string, string, number, number][]][]).map(([id, x, y, items]) => new Restaurant(id, { x, y }, items))
        partners = (a[1] as [string, number, number][]).map(([id, x, y]) => new Partner(id, { x, y }))
        strategyName = a[2] === 'least' ? 'least-delivered' : 'nearest'
        const rules = [new ItemTotals(), new PercentDiscount(10, 50000, 10000), new Tax(5), new DeliveryFee(4000, 80000)]
        svc = new FoodService(restaurants, partners, rules.map(ruleSpy), assignSpy(a[2] === 'least' ? new LeastDelivered() : new NearestPartner()))
        t.step(1, `The service is built with ${plural(restaurants.length, 'restaurant')}, ${plural(partners.length, 'delivery partner')}, the pricing rules (item totals, discount, tax, delivery fee) and the ${strategyName} assign strategy. Carts and orders are empty.`, [stockPanel(), partnersPanel()])
        out.push(null)
      } else if (op === 'addToCart') {
        const [user, rid, item, qty] = a as [string, string, string, number]
        log.push({ from: 'Caller', to: 'FoodService', label: `addToCart(${user}, ${item} x${qty})` })
        const bound = cartsOf().get(user)?.restaurantId
        const n = svc.addToCart(user, rid, item, qty)
        reply(n < 0 ? 'refused' : `${n} in cart`, n >= 0)
        t.step(1, n >= 0 ? `${user}'s cart is bound to ${rid} and now holds ${n} of ${item}. Nothing is reserved yet.` : bound && bound !== rid ? `${user}'s cart is bound to ${bound}. The Cart refuses an item from ${rid}, so a basket never mixes kitchens.` : `The service refuses before touching the cart: unknown restaurant or dish, or a quantity below 1.`, [diagram(), cartPanel(user)])
        out.push(n)
      } else if (op === 'removeFromCart') {
        const [user, item] = a as [string, string]
        log.push({ from: 'Caller', to: 'FoodService', label: `removeFromCart(${user}, ${item})` })
        const ok = svc.removeFromCart(user, item)
        reply(ok ? 'removed' : 'not in cart', ok)
        t.step(1, ok ? `${item} leaves ${user}'s cart. If that was the last item the cart is bound to no restaurant, so the next item can come from anywhere.` : `${item} was not in the cart, so nothing changes.`, [diagram(), cartPanel(user)])
        out.push(ok ? 1 : 0)
      } else if (op === 'bill') {
        const [user] = a as [string]
        log.push({ from: 'Caller', to: 'FoodService', label: `bill(${user})` })
        const b = svc.bill(user)
        reply(b.length ? `total ${b[4]}` : 'empty cart', b.length > 0)
        t.step(2, b.length ? `The service runs the rules in order. Item totals gives ${b[0]}. The discount is ${b[1]}. Tax is charged on the discounted food, ${b[2]}. Delivery is ${b[3]}. Total ${b[4]} paise.` : `The cart is empty, so there is nothing to price.`, [diagram(), billPanel(b)])
        out.push(b)
      } else if (op === 'placeOrder') {
        const [user, x, y] = a as [string, number, number]
        log.push({ from: 'Caller', to: 'FoodService', label: `placeOrder(${user})` })
        const id = svc.placeOrder(user, { x, y })
        reply(id < 0 ? 'refused' : `order ${id}`, id >= 0)
        if (id < 0) {
          const empty = marks.reserve === 0
          t.step(3, empty ? `The cart is empty, so there is nothing to place.` : `The restaurant cannot fill every line. reserve takes all of it or none of it, so stock is untouched and no order exists.`, [diagram(), empty ? cartPanel(user) : stockPanel()])
        } else {
          t.step(3, `The service asks the restaurant to reserve every line at once. It checks all lines first, then takes them, so two buyers cannot both get the last portion.`, [diagram(marks.reserve), stockPanel()])
          t.step(2, `The same rules price the lines once more. This bill is copied into the Order, so a later menu change cannot alter what the customer pays.`, [diagram(marks.rules), billPanel([ordersOf()[id - 1].bill.subtotal, ordersOf()[id - 1].bill.discount, ordersOf()[id - 1].bill.tax, ordersOf()[id - 1].bill.delivery, ordersOf()[id - 1].bill.total])])
          t.step(3, `Order ${id} starts as Placed and the cart is cleared.`, [diagram(), ordersPanel(id)])
        }
        out.push(id)
      } else if (op === 'accept') {
        const id = a[0] as number
        log.push({ from: 'Caller', to: 'FoodService', label: `accept(${id})` })
        const was = ordersOf()[id - 1]?.state
        const ok = svc.accept(id)
        reply(ok ? 'accepted' : 'refused', ok)
        if (ok) {
          t.step(4, `Order.can says Placed may become Accepted. The service then asks the ${strategyName} strategy for a partner: ${log.find((m) => m.from === 'Assign')!.label}.`, [diagram(marks.pick), partnersPanel()])
          t.step(4, `The order moves to Accepted and the partner is marked busy, so nobody else is sent to the same job.`, [diagram(), ordersPanel(id)])
        } else {
          t.step(4, !was ? `There is no order ${id}.` : was !== 'Placed' ? `Order ${id} is ${was}. Accepted is only reachable from Placed, so the table refuses.` : `Every partner is busy, so the strategy returns nobody. The order stays Placed and can be accepted again later.`, [diagram(), ordersPanel(id)])
        }
        out.push(ok ? 1 : 0)
      } else if (op === 'startPreparing' || op === 'pickUp' || op === 'deliver') {
        const id = a[0] as number
        const target: OrderState = op === 'startPreparing' ? 'Preparing' : op === 'pickUp' ? 'PickedUp' : 'Delivered'
        const was = ordersOf()[id - 1]?.state
        log.push({ from: 'Caller', to: 'FoodService', label: `${op}(${id})` })
        const ok = op === 'startPreparing' ? svc.startPreparing(id) : op === 'pickUp' ? svc.pickUp(id) : svc.deliver(id)
        reply(ok ? 'done' : 'refused', ok)
        if (ok) {
          t.step(4, `Order.move(${target}) is allowed from ${was}.${op === 'startPreparing' ? ' From here the order can no longer be cancelled.' : ''}`, [diagram(op === 'deliver' ? 3 : log.length), ordersPanel(id)])
          if (op === 'deliver') t.step(5, `The partner is free again, standing at the customer's door, with one more delivery on their count.`, [diagram(), partnersPanel()])
        } else {
          t.step(4, was ? `Order ${id} is ${was}. ${target} is not reachable from there, so the table refuses.` : `There is no order ${id}.`, [diagram(), ordersPanel(id)])
        }
        out.push(ok ? 1 : 0)
      } else if (op === 'cancel') {
        const id = a[0] as number
        const was = ordersOf()[id - 1]?.state
        log.push({ from: 'Caller', to: 'FoodService', label: `cancel(${id})` })
        const refund = svc.cancel(id)
        reply(refund < 0 ? 'refused' : `refund ${refund}`, refund >= 0)
        if (refund >= 0) {
          t.step(4, `Order.move(Cancelled) is allowed from ${was}.`, [diagram(3), ordersPanel(id)])
          t.step(5, `The reserved portions go back on the shelf and any assigned partner is freed. The customer is refunded the locked total, ${refund} paise.`, [diagram(), stockPanel()])
        } else {
          t.step(4, was ? `Order ${id} is ${was}. Cancelled is only allowed before preparing starts, because the food is already being made. Nothing changes.` : `There is no order ${id}.`, [diagram(), ordersPanel(id)])
        }
        out.push(refund)
      } else if (op === 'status') {
        const id = a[0] as number
        log.push({ from: 'Caller', to: 'FoodService', label: `status(${id})` })
        const s = svc.status(id)
        reply(s, s !== 'none')
        t.step(4, s === 'none' ? `There is no order ${id}.` : `Order ${id} reports ${s}. The state and the partner are both stored on the Order.`, [diagram(), ordersPanel(id)])
        out.push(s)
      } else if (op === 'stock') {
        const [rid, item] = a as [string, string]
        log.push({ from: 'Caller', to: 'FoodService', label: `stock(${rid}, ${item})` })
        const n = svc.stock(rid, item)
        reply(`${n}`, n >= 0)
        t.step(3, n >= 0 ? `${rid} has ${n} of ${item} left.` : `Unknown restaurant or dish.`, [diagram(), stockPanel(item)])
        out.push(n)
      }
    })
  } finally {
    for (const [proto, name, orig] of patched) (proto as Record<string, unknown>)[name] = orig
  }
  return out
}
