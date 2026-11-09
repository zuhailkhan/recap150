import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import {
  BestSingle, BuyXGetY, Cart, CouponEngine, FlatOff, HasCategory, MinCart, NotExpired, PercentOff, StackInOrder, UnderLimit, Usage,
  type Applied, type Coupon, type DiscountStrategy, type Quote, type Spec, type StackingPolicy,
} from './standard'

// Replays operations against a real CouponEngine. Specs, strategies and the stacking policy are wrapped in spies,
// so the sequence diagram shows the calls that really happened.
//
// A coupon is [code, priority, strategy, specs]:
//   strategy: ["percent", pct, category or ""], ["flat", cents], ["bogo", sku, x, y]
//   specs:    ["min", cents], ["expires", lastDay], ["limit", max], ["category", name]
type StrategyRow = ['percent', number, string] | ['flat', number] | ['bogo', string, number, number]
type SpecRow = ['min', number] | ['expires', number] | ['limit', number] | ['category', string]
type CouponRow = [string, number, StrategyRow, SpecRow[]]

const ACTORS = ['Caller', 'Engine', 'Spec', 'Strategy', 'Policy']

const strategyText = (s: StrategyRow) => (s[0] === 'percent' ? `${s[1]}% off${s[2] ? ` ${s[2]}` : ''}` : s[0] === 'flat' ? `${s[1]} off` : `buy ${s[2]} get ${s[3]} free (${s[1]})`)
const specText = (s: SpecRow) => (s[0] === 'min' ? `min ${s[1]}` : s[0] === 'expires' ? `until day ${s[1]}` : s[0] === 'limit' ? `limit ${s[1]} uses` : `needs ${s[1]}`)

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const out: unknown[] = []
  const cart = new Cart()
  let usage = new Usage()
  const asked = new Map<string, number>() // what each strategy returned in the current request
  let engine!: CouponEngine
  let policyName = ''
  let stacking = false
  let rows: CouponRow[] = []

  const specSpy = (code: string, kind: string, inner: Spec): Spec => ({
    name: inner.name,
    ok(c, today) {
      const ok = inner.ok(c, today)
      log.push({ from: 'Engine', to: 'Spec', label: `${code} ${kind}: ${ok ? 'ok' : 'fails'}`, tone: ok ? 'hit' : 'miss' })
      return ok
    },
  })
  const strategySpy = (code: string, inner: DiscountStrategy): DiscountStrategy => ({
    amount(c, payable) {
      const cents = inner.amount(c, payable)
      asked.set(code, cents)
      log.push({ from: 'Policy', to: 'Strategy', label: `${code} asks ${cents}`, tone: 'focus' })
      return cents
    },
  })
  const policySpy = (inner: StackingPolicy): StackingPolicy => ({
    choose(coupons, c) {
      log.push({ from: 'Engine', to: 'Policy', label: `choose(${coupons.length} coupon${coupons.length === 1 ? '' : 's'})` })
      return inner.choose(coupons, c)
    },
  })

  const build = (r: CouponRow): Coupon => {
    const [code, priority, s, specs] = r
    const strategy = s[0] === 'percent' ? new PercentOff(s[1], s[2] || undefined) : s[0] === 'flat' ? new FlatOff(s[1]) : new BuyXGetY(s[1], s[2], s[3])
    const built = specs.map((d): Spec => {
      const inner = d[0] === 'min' ? new MinCart(d[1]) : d[0] === 'expires' ? new NotExpired(d[1]) : d[0] === 'limit' ? new UnderLimit(code, d[1], usage) : new HasCategory(d[1])
      return specSpy(code, d[0], inner)
    })
    return { code, priority, specs: built, strategy: strategySpy(code, strategy) }
  }

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const cartPanel = (hot?: string): Panel => {
    const lines = cart.items.map((i) => ({ key: `${i.sku} (${i.category})`, items: [`${i.qty} x ${i.unitCents}`, `= ${i.qty * i.unitCents}`], tone: i.sku === hot ? ('focus' as const) : undefined }))
    return buckets([...lines, { key: 'subtotal', items: [cart.subtotal()], tone: 'keep' as const }], { label: 'cart, in integer cents', keyLabel: 'line', empty: 'empty cart' })
  }
  const catalogPanel = (): Panel => buckets(rows.map((r) => ({ key: r[0], items: [`priority ${r[1]}`, strategyText(r[2]), ...r[3].map(specText)] })), { label: `coupons, policy: ${policyName}`, keyLabel: 'code' })
  const waterfall = (q: Quote): Panel => {
    let left = cart.subtotal()
    const steps = q.applied.map((a) => {
      left -= a.cents
      return { key: a.code, items: [`-${a.cents}`, `left ${left}`], tone: 'focus' as const }
    })
    return buckets([{ key: 'cart subtotal', items: [cart.subtotal()], tone: 'keep' as const }, ...steps, { key: 'total to pay', items: [q.total], tone: 'hit' as const }], { label: 'price after each applied coupon', keyLabel: 'step' })
  }
  const verdicts = (codes: string[], rejected: string[]): Panel => {
    let j = 0
    const labels = codes.map((c) => (rejected[j]?.startsWith(c + ':') ? rejected[j++].replace(':', ' - ') : c))
    return arr(labels, { label: 'codes given: green = eligible, red = rejected and why', tones: labels.map((l) => (l.includes(' - ') ? ('miss' as const) : ('hit' as const))) })
  }
  const askedPanel = (codes: string[]): Panel =>
    buckets(codes.map((c) => ({ key: c, items: [`asks ${asked.get(c) ?? 0}`], tone: 'focus' as const })), { label: stacking ? 'what each strategy asked, on what was still payable' : 'what each strategy asked, each on the full subtotal', keyLabel: 'coupon' })

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'CouponEngine') {
      const p = a[0] as [string, number?]
      stacking = p[0] === 'stack'
      policyName = stacking ? `stack in priority order, cap ${p[1]}%` : 'best single coupon'
      rows = a[1] as CouponRow[]
      cart.items.length = 0
      usage = new Usage()
      engine = new CouponEngine(rows.map(build), policySpy(stacking ? new StackInOrder(p[1] as number) : new BestSingle()), usage)
      t.step(2, `The engine holds ${rows.length} coupon${rows.length === 1 ? '' : 's'}. Each one is a list of eligibility specs plus one discount strategy. The stacking policy is "${policyName}".`, [catalogPanel()])
      out.push(null)
    } else if (op === 'add') {
      const [sku, category, unit, qty] = a as [string, string, number, number]
      const ok = cart.add(sku, category, unit, qty)
      t.step(1, ok ? `${qty} x ${sku} goes into the cart. A sku that is already there merges into its line instead of adding a second one.` : `A quantity of ${qty} or a price of ${unit} is refused, so the cart is unchanged.`, [cartPanel(sku)])
      out.push(ok ? 1 : 0)
    } else if (op === 'quote' || op === 'checkout') {
      const [codes, today] = a as [string[], number]
      asked.clear()
      log.push({ from: 'Caller', to: 'Engine', label: `${op}(day ${today})` })
      const q = op === 'quote' ? engine.quote(cart, codes, today) : engine.checkout(cart, codes, today)
      log.push({ from: 'Engine', to: 'Caller', label: `total ${q.total}`, dashed: true, tone: q.applied.length ? 'hit' : 'miss' })
      const specEnd = log.reduce((n, m, k) => (m.to === 'Spec' ? k + 1 : n), 1)
      const eligible = [...asked.keys()] // every eligible coupon's strategy is asked
      t.step(2, `Each code is looked up and its specs are asked in order. The first spec that says no is the reason, and later specs are skipped.${q.rejected.length ? ` Rejected: ${q.rejected.join(', ')}.` : ' All were eligible.'}`, [diagram(specEnd), verdicts(codes, q.rejected)])
      if (eligible.length) t.step(3, `The policy asks each eligible strategy for an amount. ${stacking ? 'They run in priority order, each on what is still payable.' : 'Each one is priced alone on the full subtotal.'}`, [diagram(log.length - 1), askedPanel(eligible)])
      const clipped = stacking && eligible.some((c) => (asked.get(c) ?? 0) > (q.applied.find((x: Applied) => x.code === c)?.cents ?? 0))
      t.step(4, !q.applied.length ? `Nothing eligible took anything off, so the total stays ${cart.subtotal()}.` : stacking ? `The policy applies ${q.applied.map((x) => x.code).join(', then ')}. Total ${q.total}.` : `The policy keeps only the biggest: ${q.applied[0].code}, saving ${q.applied[0].cents}. Total ${q.total}.`, [diagram(log.length - 1), waterfall(q)])
      if (clipped) t.step(5, `A coupon asked for more than was allowed, so it was clipped to what was left under the cap and the price.`, [askedPanel(eligible), waterfall(q)])
      if (op === 'checkout') t.step(6, `Checkout counts one use for each applied coupon: ${q.applied.length ? q.applied.map((x) => `${x.code} is now ${usage.used(x.code)}`).join(', ') : 'none applied, so nothing is used up'}.`, [buckets(rows.map((r) => ({ key: r[0], items: [`used ${usage.used(r[0])}`], tone: q.applied.some((x) => x.code === r[0]) ? ('keep' as const) : undefined })), { label: 'redemptions so far', keyLabel: 'code' })])
      out.push([q.total, q.applied.map((x) => `${x.code}:${x.cents}`), q.rejected])
    }
  })
  return out
}
