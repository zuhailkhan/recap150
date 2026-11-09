/** One person in an expense. What value means depends on the strategy: ignored, cents or percent. */
export interface Share {
  user: string
  value: number
}

export interface Payment {
  from: string
  to: string
  cents: number
}

/** How an amount is divided. Returns cents per participant, in the same order. Throws if the input is invalid. */
export interface SplitStrategy {
  split(amount: number, parts: Share[]): number[]
}

/** Rounding rule: when floors leave cents over, each of the first participants, in the given order, gets one more. */
function topUp(shares: number[], amount: number): number[] {
  let left = amount - shares.reduce((a, b) => a + b, 0)
  return shares.map((s) => (left-- > 0 ? s + 1 : s))
}

export class EqualSplit implements SplitStrategy {
  split(amount: number, parts: Share[]): number[] {
    return topUp(parts.map(() => Math.floor(amount / parts.length)), amount)
  }
}

export class ExactSplit implements SplitStrategy {
  split(amount: number, parts: Share[]): number[] {
    const cents = parts.map((p) => p.value)
    if (cents.some((c) => !Number.isInteger(c) || c < 0)) throw new Error('amounts must be whole cents, not negative')
    if (cents.reduce((a, b) => a + b, 0) !== amount) throw new Error('amounts must add up to the total')
    return cents
  }
}

export class PercentSplit implements SplitStrategy {
  split(amount: number, parts: Share[]): number[] {
    const pct = parts.map((p) => p.value)
    if (pct.some((p) => !Number.isInteger(p) || p <= 0)) throw new Error('percentages must be whole numbers above 0')
    if (pct.reduce((a, b) => a + b, 0) !== 100) throw new Error('percentages must add up to 100')
    return topUp(pct.map((p) => Math.floor((amount * p) / 100)), amount)
  }
}

/** Who owes whom. owes[i][j] is what member i owes member j. At most one of owes[i][j] and owes[j][i] is above 0. */
export class Ledger {
  private owes: number[][]

  constructor(private members: string[]) {
    this.owes = members.map(() => members.map(() => 0))
  }

  /** debtor now owes creditor `cents` more. Debts in the opposite direction are cancelled first. */
  transfer(debtor: string, creditor: string, cents: number): void {
    const i = this.members.indexOf(debtor)
    const j = this.members.indexOf(creditor)
    if (i === j || cents === 0) return
    const net = this.owes[i][j] - this.owes[j][i] + cents // above 0: i owes j
    this.owes[i][j] = Math.max(net, 0)
    this.owes[j][i] = Math.max(-net, 0)
  }

  /** Per member: what others owe them minus what they owe. Above 0 is owed money. The total is always 0. */
  nets(): number[] {
    return this.members.map((_, i) => this.members.reduce((sum, _m, j) => sum + this.owes[j][i] - this.owes[i][j], 0))
  }

  /** Every open debt, debtor in member order, then creditor in member order. */
  debts(): Payment[] {
    const out: Payment[] = []
    this.members.forEach((from, i) => this.members.forEach((to, j) => this.owes[i][j] > 0 && out.push({ from, to, cents: this.owes[i][j] })))
    return out
  }
}

/** Greedy: the biggest debtor pays the biggest creditor, as much as settles one of them. Ties go to the earlier member. */
export function minimizePayments(members: string[], balance: number[]): Payment[] {
  const bal = [...balance]
  const out: Payment[] = []
  for (;;) {
    let c = 0
    let d = 0
    bal.forEach((b, i) => {
      if (b > bal[c]) c = i
      if (b < bal[d]) d = i
    })
    if (bal[c] <= 0 || bal[d] >= 0) return out
    const cents = Math.min(bal[c], -bal[d])
    out.push({ from: members[d], to: members[c], cents }) // [4] one payment clears at least one person
    bal[c] -= cents
    bal[d] += cents
  }
}

export class Group {
  constructor(
    private members: string[],
    private ledger: Ledger,
  ) {}

  /** Amounts are whole cents. Returns false, and records nothing, if the expense is invalid. */
  addExpense(payer: string, amount: number, parts: Share[], strategy: SplitStrategy): boolean {
    const users = parts.map((p) => p.user)
    const known = (u: string) => this.members.includes(u)
    if (!known(payer) || !Number.isInteger(amount) || amount <= 0 || !users.length) return false // [1] check who and how much
    if (!users.every(known) || new Set(users).size !== users.length) return false
    let shares: number[]
    try {
      shares = strategy.split(amount, parts) // [2] the strategy decides each person's cents
    } catch {
      return false
    }
    parts.forEach((p, i) => this.ledger.transfer(p.user, payer, shares[i])) // [3] each participant owes the payer their share
    return true
  }

  /** The payer-side view of a payment that already happened: from paid `cents` to `to`. */
  pay(from: string, to: string, cents: number): boolean {
    if (!this.members.includes(from) || !this.members.includes(to) || from === to || !Number.isInteger(cents) || cents <= 0) return false
    this.ledger.transfer(to, from, cents)
    return true
  }

  balances(): string[] {
    const nets = this.ledger.nets()
    return this.members.map((m, i) => `${m}:${nets[i]}`)
  }

  debts(): string[] {
    return this.ledger.debts().map((d) => `${d.from}>${d.to}:${d.cents}`)
  }

  /** A plan only. It changes nothing until someone calls pay. */
  settle(): Payment[] {
    return minimizePayments(this.members, this.ledger.nets())
  }
}
