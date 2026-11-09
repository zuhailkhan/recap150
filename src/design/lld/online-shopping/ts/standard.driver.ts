import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Panel, type SeqMessage, type Tone } from '../../../../core/panels'
import { Cart, CardPayment, Inventory, Shop, WalletPayment, type Order, type PaymentStrategy, type Product } from './standard'

// Replays operations against a real Shop. Inventory and the two payment strategies are wrapped in spies and Cart is
// patched for the run, so the sequence diagram shows calls that really happened, in the order they happened.
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`
const CANON = ['Caller', 'Shop', 'Cart', 'Inventory', 'Payment']

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const marks = { reserve: 0, charge: 0 } // log lengths after the reserve reply and after the charge reply
  const catalog = new Map<string, Product>()
  const wallets = new Map<string, WalletPayment>()
  let inventory!: Inventory
  let shop!: Shop
  const out: unknown[] = []

  const spyInventory = (inv: Inventory): Inventory => {
    const say = (answer: string, tone: Tone): void => {
      log.push({ from: 'Inventory', to: 'Shop', label: answer, dashed: true, tone })
    }
    const reserve = inv.reserve.bind(inv)
    inv.reserve = (lines) => {
      log.push({ from: 'Shop', to: 'Inventory', label: `reserve(${lines.map((l) => `${l.sku}x${l.qty}`).join(', ')})` })
      const hold = reserve(lines)
      say(hold ? `hold ${hold}` : 'short, nothing held', hold ? 'hit' : 'miss')
      marks.reserve = log.length
      return hold
    }
    const confirm = inv.confirm.bind(inv)
    inv.confirm = (hold) => {
      log.push({ from: 'Shop', to: 'Inventory', label: `confirm(hold ${hold})` })
      confirm(hold)
      say('sold', 'hit')
    }
    const release = inv.release.bind(inv)
    inv.release = (hold) => {
      log.push({ from: 'Shop', to: 'Inventory', label: `release(hold ${hold})` })
      release(hold)
      say('back on sale', 'hit')
    }
    const restock = inv.restock.bind(inv)
    inv.restock = (lines) => {
      log.push({ from: 'Shop', to: 'Inventory', label: `restock(${lines.map((l) => `${l.sku}x${l.qty}`).join(', ')})` })
      restock(lines)
      say('on hand again', 'hit')
    }
    return inv
  }
  const paySpy = (name: string, inner: PaymentStrategy): PaymentStrategy => ({
    charge(cents) {
      log.push({ from: 'Shop', to: 'Payment', label: `${name}.charge(${cents})` })
      const ok = inner.charge(cents)
      log.push({ from: 'Payment', to: 'Shop', label: ok ? 'approved' : 'declined', dashed: true, tone: ok ? 'hit' : 'miss' })
      marks.charge = log.length
      return ok
    },
    refund(cents) {
      log.push({ from: 'Shop', to: 'Payment', label: `${name}.refund(${cents})` })
      inner.refund(cents)
      log.push({ from: 'Payment', to: 'Shop', label: 'refunded', dashed: true, tone: 'hit' })
    },
  })

  const ordersOf = (): Order[] => shop['orders']
  const cartsOf = (): Map<string, Cart> => shop['carts']

  const stockPanel = (): Panel =>
    buckets([...catalog].map(([sku, p]) => {
      const [onHand, reserved] = inventory.levels(sku)!
      return { key: `${sku} ${p.name}`, items: [`on hand ${onHand}`, `reserved ${reserved}`, `free ${onHand - reserved}`], tone: (reserved > 0 ? 'keep' : onHand === 0 ? 'miss' : undefined) as Tone | undefined }
    }), { label: 'stock: on hand, reserved (promised, unpaid), free to reserve', keyLabel: 'product' })
  const cartPanel = (user?: string): Panel =>
    buckets([...cartsOf()].filter(([, c]) => c.entries().length > 0).map(([u, c]) => ({ key: u, items: c.entries().map(([sku, q]) => `${catalog.get(sku)!.name} x${q}`), tone: (u === user ? 'focus' : 'keep') as Tone })), { label: 'carts', keyLabel: 'customer', empty: 'all carts are empty' })
  const ordersPanel = (hot?: number): Panel =>
    buckets(ordersOf().map((o) => ({
      key: `order ${o.id}`, items: [o.state, `${o.total} cents`, `hold ${o.hold}`],
      tone: (o.id === hot ? 'focus' : o.state === 'Paid' ? 'hit' : o.state === 'PaymentFailed' || o.state === 'Cancelled' ? 'miss' : 'keep') as Tone,
    })), { label: 'orders: state, total, hold', keyLabel: 'order', empty: 'no orders yet' })
  const walletPanel = (): Panel =>
    arr([...wallets].map(([u, w]) => `${u}: wallet ${w.balance}`), { label: 'wallet balances in cents' })
  const diagram = (upTo = log.length): Panel => {
    const used = new Set(log.flatMap((m) => [m.from, m.to]))
    return seq(CANON.filter((a) => used.has(a)), log.slice(0, upTo), { label: 'calls in this request' })
  }
  const reply = (label: string, ok: boolean) => log.push({ from: 'Shop', to: 'Caller', label, dashed: true, tone: ok ? 'hit' : 'miss' })

  const realAdd = Cart.prototype.add
  const realRemove = Cart.prototype.remove
  const realClear = Cart.prototype.clear
  Cart.prototype.add = function (this: Cart, sku: string, n: number) {
    log.push({ from: 'Shop', to: 'Cart', label: `add(${sku}, ${n})` })
    const total = realAdd.call(this, sku, n)
    log.push({ from: 'Cart', to: 'Shop', label: `${total} of ${sku}`, dashed: true, tone: 'hit' })
    return total
  }
  Cart.prototype.remove = function (this: Cart, sku: string) {
    log.push({ from: 'Shop', to: 'Cart', label: `remove(${sku})` })
    const ok = realRemove.call(this, sku)
    log.push({ from: 'Cart', to: 'Shop', label: ok ? 'removed' : 'not there', dashed: true, tone: ok ? 'hit' : 'miss' })
    return ok
  }
  Cart.prototype.clear = function (this: Cart) {
    log.push({ from: 'Shop', to: 'Cart', label: 'clear()' })
    realClear.call(this)
    log.push({ from: 'Cart', to: 'Shop', label: 'empty', dashed: true, tone: 'hit' })
  }

  try {
    ops.forEach((op, i) => {
      const a = args[i]
      log.length = 0
      marks.reserve = marks.charge = 0
      if (op === 'Shop') {
        catalog.clear()
        wallets.clear()
        const stock: [string, number][] = []
        for (const [sku, name, price, onHand] of a[0] as [string, string, number, number][]) {
          catalog.set(sku, { name, price })
          stock.push([sku, onHand])
        }
        inventory = spyInventory(new Inventory(stock))
        const customers = new Map<string, Record<string, PaymentStrategy>>()
        for (const [user, limit, balance] of a[1] as [string, number, number][]) {
          const w = new WalletPayment(balance)
          wallets.set(user, w)
          customers.set(user, { card: paySpy('card', new CardPayment(limit)), wallet: paySpy('wallet', w) })
        }
        shop = new Shop(catalog, inventory, customers)
        t.step(1, `The shop is built with a catalog of ${plural(catalog.size, 'product')}, an Inventory, and ${plural(customers.size, 'customer')}, each with a card and a wallet behind the same PaymentStrategy interface.`, [stockPanel(), walletPanel()])
        out.push(null)
      } else if (op === 'addToCart') {
        const [user, sku, qty] = a as [string, string, number]
        log.push({ from: 'Caller', to: 'Shop', label: `addToCart(${user}, ${sku} x${qty})` })
        const n = shop.addToCart(user, sku, qty)
        reply(n < 0 ? 'refused' : `${n} in cart`, n >= 0)
        t.step(1, n >= 0 ? `${sku} goes into ${user}'s cart, ${n} in total. A cart is a wish list: it reserves nothing, so a full cart never hides stock from other people.` : `The shop refuses: unknown customer or product, or a quantity below 1.`, [diagram(), cartPanel(user)])
        out.push(n)
      } else if (op === 'removeFromCart') {
        const [user, sku] = a as [string, string]
        log.push({ from: 'Caller', to: 'Shop', label: `removeFromCart(${user}, ${sku})` })
        const ok = shop.removeFromCart(user, sku)
        reply(ok ? 'removed' : 'not in cart', ok)
        t.step(1, ok ? `${sku} leaves ${user}'s cart.` : `${sku} was not in the cart, so nothing changes.`, [diagram(), cartPanel(user)])
        out.push(ok ? 1 : 0)
      } else if (op === 'cartTotal') {
        const [user] = a as [string]
        log.push({ from: 'Caller', to: 'Shop', label: `cartTotal(${user})` })
        const n = shop.cartTotal(user)
        reply(`${n} cents`, true)
        t.step(1, `The cart is priced from the catalog: ${n} cents. Price is a catalog fact, copied into the order only at checkout.`, [diagram(), cartPanel(user)])
        out.push(n)
      } else if (op === 'checkout') {
        const [user] = a as [string]
        log.push({ from: 'Caller', to: 'Shop', label: `checkout(${user})` })
        const id = shop.checkout(user)
        reply(id ? `order ${id}` : 'refused', id > 0)
        if (id > 0) {
          t.step(2, `The shop asks the Inventory to reserve every line at once. It checks all lines first, then promises them. The units stay on hand but are no longer free for anyone else.`, [diagram(marks.reserve), stockPanel()])
          t.step(2, `The cart moves into order ${id}, which starts as Pending and remembers its hold. Nothing is sold yet.`, [diagram(), ordersPanel(id)])
        } else if (marks.reserve) {
          t.step(2, `A line is short, so reserve takes nothing: not even the lines that could have been filled. No order exists and the cart is untouched.`, [diagram(), stockPanel()])
        } else {
          t.step(2, `The cart is empty, so there is nothing to reserve.`, [diagram(), cartPanel(user)])
        }
        out.push(id)
      } else if (op === 'pay') {
        const [id, method] = a as [number, string]
        const was = ordersOf()[id - 1]?.state
        log.push({ from: 'Caller', to: 'Shop', label: `pay(order ${id}, ${method})` })
        const r = shop.pay(id, method)
        reply(r === 1 ? 'paid' : r === 0 ? 'declined' : 'refused', r === 1)
        if (r === -1) {
          t.step(3, !was ? `There is no order ${id}.` : was !== 'Pending' ? `Order ${id} is ${was}, not Pending, so it cannot be paid. The shop does not even call the strategy.` : `This customer has no "${method}" method. The order stays Pending with its stock still held.`, [diagram(), ordersPanel(id)])
        } else if (r === 1) {
          t.step(3, `The shop asks the ${method} strategy to charge ${ordersOf()[id - 1].total} cents. It cannot tell a card from a wallet, it only sees an interface. Approved.`, [diagram(marks.charge), walletPanel()])
          t.step(4, `Payment is in, so the Inventory confirms the hold: the units leave the shelf and the reservation ends. Order ${id} is Paid.`, [diagram(), stockPanel()])
        } else {
          t.step(3, `The ${method} strategy declines ${ordersOf()[id - 1].total} cents. The shop does not know why, and does not need to.`, [diagram(marks.charge), walletPanel()])
          t.step(5, `Declined, so the Inventory releases the hold and the units are for sale again. The items return to the cart, and order ${id} is PaymentFailed.`, [diagram(), stockPanel()])
        }
        out.push(r)
      } else if (op === 'cancel') {
        const id = a[0] as number
        const was = ordersOf()[id - 1]?.state
        log.push({ from: 'Caller', to: 'Shop', label: `cancel(order ${id})` })
        const r = shop.cancel(id)
        reply(r < 0 ? 'refused' : `refund ${r}`, r >= 0)
        t.step(5, r < 0 ? (was ? `Order ${id} is ${was}. Only Pending and Paid orders can be cancelled.` : `There is no order ${id}.`) : was === 'Pending' ? `Order ${id} was never paid, so the Inventory releases its hold and the items return to the cart. Refund: 0.` : `Order ${id} was paid. The strategy refunds ${r} cents, and the Inventory puts the sold units back on hand.`, [diagram(), stockPanel()])
        out.push(r)
      } else if (op === 'status') {
        const id = a[0] as number
        log.push({ from: 'Caller', to: 'Shop', label: `status(order ${id})` })
        const s = shop.status(id)
        reply(s, s !== 'none')
        t.step(4, s === 'none' ? `There is no order ${id}.` : `Order ${id} is ${s}.`, [diagram(), ordersPanel(id)])
        out.push(s)
      } else if (op === 'stock') {
        const [sku] = a as [string]
        log.push({ from: 'Caller', to: 'Shop', label: `stock(${sku})` })
        const s = shop.stock(sku)
        reply(s.length ? `[${s.join(', ')}]` : 'unknown', s.length > 0)
        t.step(2, s.length ? `${sku}: ${s[0]} on hand, ${s[1]} reserved. Free to reserve is the difference, ${s[0] - s[1]}.` : `There is no product ${sku}.`, [diagram(), stockPanel()])
        out.push(s)
      } else if (op === 'wallet') {
        const [user] = a as [string]
        log.push({ from: 'Caller', to: 'Payment', label: `${user}'s wallet balance` })
        const b = wallets.get(user)!.balance
        log.push({ from: 'Payment', to: 'Caller', label: `${b} cents`, dashed: true, tone: 'focus' })
        t.step(3, `${user}'s wallet holds ${b} cents. The wallet is one PaymentStrategy; the shop never reads this number.`, [diagram(), walletPanel()])
        out.push(b)
      }
    })
  } finally {
    Cart.prototype.add = realAdd
    Cart.prototype.remove = realRemove
    Cart.prototype.clear = realClear
  }
  return out
}
