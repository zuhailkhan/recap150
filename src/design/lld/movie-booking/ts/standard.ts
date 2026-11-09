// Time is an integer (say, minutes) passed in by the caller. A hold is live while now < until.
export type Category = 'regular' | 'premium'
export type SeatState = 'available' | 'held' | 'booked'

export interface Screen {
  name: string
  layout: Category[] // seat 1 is layout[0], seat 2 is layout[1], and so on
}

/** One seat in one show. It owns the Available -> Held -> Booked state machine and refuses bad moves. */
export class Seat {
  state: SeatState = 'available'
  holdId = 0
  until = 0

  constructor(readonly id: number, readonly category: Category) {}

  expire(now: number): void {
    if (this.state === 'held' && this.until <= now) this.free() // [2] a lapsed hold frees the seat
  }
  hold(holdId: number, until: number): void {
    this.state = 'held'
    this.holdId = holdId
    this.until = until
  }
  book(): void {
    this.state = 'booked'
  }
  free(): void {
    this.state = 'available'
    this.holdId = 0
  }
}

/** A movie on one screen. Its seats are made fresh, so each show sells its own seats. */
export class Show {
  readonly seats: Seat[]

  constructor(readonly id: number, readonly movie: string, screen: Screen) {
    this.seats = screen.layout.map((c, i) => new Seat(i + 1, c))
  }

  private pick(ids: number[]): Seat[] | null {
    const seats = ids.map((id) => this.seats[id - 1])
    return ids.length > 0 && new Set(ids).size === ids.length && seats.every(Boolean) ? seats : null
  }

  sweep(now: number): void {
    for (const s of this.seats) s.expire(now)
  }

  /** All or nothing: every seat must be available, or none is touched. */
  hold(ids: number[], holdId: number, until: number): Seat[] | null {
    const seats = this.pick(ids)
    if (!seats || seats.some((s) => s.state !== 'available')) return null
    for (const s of seats) s.hold(holdId, until) // [3] Available -> Held, in one step with the check
    return seats
  }

  /** Held -> Booked, but only for seats still held by this very hold. */
  book(ids: number[], holdId: number): boolean {
    const seats = this.pick(ids)
    if (!seats || seats.some((s) => s.state !== 'held' || s.holdId !== holdId)) return false
    for (const s of seats) s.book() // [5] Held -> Booked
    return true
  }

  /** Held -> Available, only for seats that this hold still owns. */
  release(ids: number[], holdId: number): void {
    for (const s of this.pick(ids) ?? []) if (s.state === 'held' && s.holdId === holdId) s.free() // [6] give the seat back
  }

  /** Booked -> Available. */
  cancel(ids: number[]): void {
    for (const s of this.pick(ids) ?? []) if (s.state === 'booked') s.free()
  }

  free(): number[] {
    return this.seats.filter((s) => s.state === 'available').map((s) => s.id)
  }
}

export interface Pricing {
  price(c: Category): number
}

export class ByCategory implements Pricing {
  constructor(private rates: Record<Category, number>) {}

  price(c: Category): number {
    return this.rates[c]
  }
}

/** Wraps another rule and adds a percentage, in whole money units. */
export class PeakSurcharge implements Pricing {
  constructor(private inner: Pricing, private percent: number) {}

  price(c: Category): number {
    return Math.floor((this.inner.price(c) * (100 + this.percent)) / 100)
  }
}

export interface Hold {
  id: number
  showId: number
  user: string
  seats: number[]
  total: number // the price is quoted at hold time and stays fixed
  until: number
}

export interface Booking {
  id: number
  showId: number
  user: string
  seats: number[]
  total: number
}

export class BookingService {
  private holds = new Map<number, Hold>()
  private bookings = new Map<number, Booking>()
  private nextHold = 1
  private nextBooking = 1

  constructor(
    private shows: Map<number, Show>, // [1] the service owns the shows and is handed its price rule and hold length
    private pricing: Pricing,
    private holdFor: number,
  ) {}

  /** Returns the hold id, or -1 if the show is unknown or any seat is missing or taken. */
  hold(showId: number, user: string, seatIds: number[], now: number): number {
    const show = this.shows.get(showId)
    if (!show) return -1
    show.sweep(now)
    const until = now + this.holdFor
    const seats = show.hold(seatIds, this.nextHold, until)
    if (!seats) return -1
    const total = seats.reduce((sum, s) => sum + this.pricing.price(s.category), 0) // [4] ask the strategy, per seat category
    const hold = { id: this.nextHold++, showId, user, seats: seatIds, total, until }
    this.holds.set(hold.id, hold)
    return hold.id
  }

  /** Turns a live hold into a booking and returns it. Null if it is not yours, not found, or has lapsed. */
  confirm(holdId: number, user: string, now: number): Booking | null {
    const hold = this.holds.get(holdId)
    if (!hold || hold.user !== user) return null
    const show = this.shows.get(hold.showId)!
    show.sweep(now)
    this.holds.delete(holdId) // used up or dead, either way it cannot be tried again
    if (!show.book(hold.seats, hold.id)) return null
    const booking = { id: this.nextBooking++, showId: hold.showId, user, seats: hold.seats, total: hold.total }
    this.bookings.set(booking.id, booking)
    return booking
  }

  /** Gives up your own hold. Returns false if there is no such hold of yours. */
  release(holdId: number, user: string): boolean {
    const hold = this.holds.get(holdId)
    if (!hold || hold.user !== user) return false
    this.shows.get(hold.showId)!.release(hold.seats, hold.id)
    return this.holds.delete(holdId)
  }

  /** Cancels your booking, frees its seats and returns the refund. -1 if it is not yours. */
  cancel(bookingId: number, user: string): number {
    const b = this.bookings.get(bookingId)
    if (!b || b.user !== user) return -1
    this.shows.get(b.showId)!.cancel(b.seats)
    this.bookings.delete(bookingId)
    return b.total
  }

  available(showId: number, now: number): number[] {
    const show = this.shows.get(showId)
    show?.sweep(now)
    return show?.free() ?? []
  }

  stateOf(showId: number, seatId: number, now: number): SeatState | 'none' {
    const show = this.shows.get(showId)
    show?.sweep(now)
    return show?.seats[seatId - 1]?.state ?? 'none'
  }
}
