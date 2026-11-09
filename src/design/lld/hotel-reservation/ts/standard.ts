// Days are integers. A stay is the half-open range [from, to): the guest sleeps the nights from..to-1
// and leaves on day `to`. Day 0 is a Monday. A failed call returns a negative code and changes nothing.
export interface Booking {
  id: number
  guest: string
  roomId: string
  from: number // check-in day, included
  to: number // check-out day, excluded
  price: number
}

/** Two half-open ranges share a night exactly when each starts before the other ends. */
export const overlaps = (a0: number, a1: number, b0: number, b1: number): boolean => a0 < b1 && b0 < a1 // [2] touching ends do not overlap

export class Room {
  private stays: Booking[] = []

  constructor(readonly id: string, readonly type: string) {}

  isFree(from: number, to: number): boolean {
    return this.stays.every((b) => !overlaps(b.from, b.to, from, to))
  }

  add(b: Booking): void {
    this.stays.push(b)
  }

  remove(bookingId: number): void {
    this.stays = this.stays.filter((b) => b.id !== bookingId)
  }

  bookings(): Booking[] {
    return [...this.stays]
  }
}

export interface Pricing {
  nightly(type: string, day: number): number
}

/** One rate per room type, the same every night. */
export class FlatRates implements Pricing {
  constructor(private rates: Record<string, number>) {}

  nightly(type: string): number {
    return this.rates[type]
  }
}

/** Wraps another Pricing and adds a percentage on Saturday and Sunday nights (day % 7 is 5 or 6). */
export class WeekendSurcharge implements Pricing {
  constructor(private inner: Pricing, private percent: number) {}

  nightly(type: string, day: number): number {
    const rate = this.inner.nightly(type, day)
    return day % 7 >= 5 ? rate + Math.floor((rate * this.percent) / 100) : rate
  }
}

export class Hotel {
  private bookings = new Map<number, Booking>()
  private nextId = 1

  constructor(
    readonly rooms: Room[], // [1] the hotel owns the rooms, in a fixed order, and is handed its pricing
    private pricing: Pricing,
  ) {}

  /** Rooms of this type with every night in [from, to) free, in room order. Empty for a bad range or type. */
  search(type: string, from: number, to: number): Room[] {
    if (from < 0 || from >= to) return []
    return this.rooms.filter((r) => r.type === type && r.isFree(from, to)) // [3] ask each room of the type
  }

  /** 0 if the range and type are fine, -2 for a bad range, -3 for an unknown type. */
  private check(type: string, from: number, to: number): number {
    if (from < 0 || from >= to) return -2
    return this.rooms.some((r) => r.type === type) ? 0 : -3
  }

  /** Total price of the stay, or -2 for a bad range, -3 for an unknown type. */
  quote(type: string, from: number, to: number): number {
    const bad = this.check(type, from, to)
    if (bad) return bad
    let total = 0
    for (let day = from; day < to; day++) total += this.pricing.nightly(type, day) // [4] price each night
    return total
  }

  /** A booking id (1, 2, ...), or -1 nothing free, -2 bad range, -3 unknown type. */
  book(guest: string, type: string, from: number, to: number): number {
    const bad = this.check(type, from, to)
    if (bad) return bad
    const room = this.search(type, from, to)[0] // the first free room, in room order
    if (!room) return -1
    const price = this.quote(type, from, to)
    const b = { id: this.nextId++, guest, roomId: room.id, from, to, price }
    room.add(b) // [5] the room now blocks these nights
    this.bookings.set(b.id, b)
    return b.id
  }

  /** The refund (the full price), or -1 for an unknown or already cancelled booking. */
  cancel(bookingId: number): number {
    const b = this.bookings.get(bookingId)
    if (!b) return -1
    this.rooms.find((r) => r.id === b.roomId)!.remove(bookingId) // [6] the nights are free again
    this.bookings.delete(bookingId)
    return b.price
  }

  roomOf(bookingId: number): string | null {
    return this.bookings.get(bookingId)?.roomId ?? null
  }
}
