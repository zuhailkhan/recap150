// Days and money are integers. A failed call returns a negative code and changes nothing.
export interface FinePolicy {
  fine(daysLate: number): number
}

/** A fixed fine for every day late. */
export class PerDayFine implements FinePolicy {
  constructor(private rate: number) {}

  fine(daysLate: number): number {
    return daysLate * this.rate
  }
}

/** The same, but never more than a cap, so a forgotten loan cannot cost more than the book. */
export class CappedFine implements FinePolicy {
  constructor(private rate: number, private cap: number) {}

  fine(daysLate: number): number {
    return Math.min(daysLate * this.rate, this.cap)
  }
}

export interface Book {
  id: string
  free: number // copies on the shelf that nobody is waiting for
}

export interface Member {
  id: string
  loans: number // books currently out
}

export interface Loan {
  id: number
  member: string
  book: string
  due: number // the last day it can come back without a fine
  open: boolean
}

/** Per book: a FIFO queue of members waiting, and the members whose returned copy is being held for them. */
export class Reservations {
  private queue = new Map<string, string[]>()
  private ready = new Map<string, string[]>()

  /** Position in the queue (1 is next), or -3 if the member already waits or holds a copy. */
  join(book: string, member: string): number {
    const q = this.queue.get(book) ?? []
    if (q.includes(member) || this.held(book).includes(member)) return -3
    this.queue.set(book, [...q, member])
    return q.length + 1
  }

  /** A copy came back: move the head of the queue to "ready". False when nobody is waiting. */
  next(book: string): boolean {
    const [head, ...rest] = this.queue.get(book) ?? []
    if (head === undefined) return false
    this.queue.set(book, rest)
    this.ready.set(book, [...this.held(book), head])
    return true
  }

  /** Use up a held copy. False when none is held for this member. */
  claim(book: string, member: string): boolean {
    const h = this.held(book)
    if (!h.includes(member)) return false
    this.ready.set(book, h.filter((m) => m !== member))
    return true
  }

  waiting(book: string): string[] {
    return [...(this.queue.get(book) ?? [])]
  }

  held(book: string): string[] {
    return [...(this.ready.get(book) ?? [])]
  }
}

export class Library {
  private loans = new Map<number, Loan>()
  private nextId = 1

  constructor(
    readonly books: Map<string, Book>, // [1] the library owns books and members, and is handed its rules
    readonly members: Map<string, Member>,
    private reservations: Reservations,
    private policy: FinePolicy,
    private limit: number,
    private loanDays: number,
  ) {}

  /** A loan id (1, 2, ...), or -1 unknown member or book, -2 at the limit, -3 no copy for this member. */
  borrow(memberId: string, bookId: string, today: number): number {
    const member = this.members.get(memberId)
    const book = this.books.get(bookId)
    if (!member || !book) return -1
    if (member.loans >= this.limit) return -2 // [2] the limit is checked first, so a held copy is not wasted
    const held = this.reservations.claim(bookId, memberId) // [3] a copy held for you comes before the shelf
    if (!held && book.free === 0) return -3
    if (!held) book.free--
    member.loans++
    const loan = { id: this.nextId++, member: memberId, book: bookId, due: today + this.loanDays, open: true }
    this.loans.set(loan.id, loan)
    return loan.id
  }

  /** Queue position, or -1 unknown, -2 a copy is free (just borrow it), -3 already waiting. */
  reserve(memberId: string, bookId: string): number {
    const book = this.books.get(bookId)
    if (!this.members.has(memberId) || !book) return -1
    if (book.free > 0) return -2
    return this.reservations.join(bookId, memberId) // [4] join the back of the queue
  }

  /** The fine (0 if on time), or -1 for an unknown or already returned loan. */
  returnBook(loanId: number, today: number): number {
    const loan = this.loans.get(loanId)
    if (!loan || !loan.open) return -1
    loan.open = false
    this.members.get(loan.member)!.loans--
    const fine = this.policy.fine(Math.max(0, today - loan.due)) // [5] the policy prices the lateness
    if (!this.reservations.next(loan.book)) this.books.get(loan.book)!.free++ // [6] hold it for the queue head, else shelve it
    return fine
  }

  dueOf(loanId: number): number {
    return this.loans.get(loanId)?.due ?? -1
  }

  count(memberId: string): number {
    return this.members.get(memberId)?.loans ?? -1
  }
}
