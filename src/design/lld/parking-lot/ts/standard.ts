// Sizes: 1 = motorcycle, 2 = car, 3 = truck. A vehicle fits any spot at least as big as itself.
export type Size = 1 | 2 | 3

export interface Vehicle {
  plate: string
  size: Size
}

export interface Spot {
  id: number
  size: Size
  taken: boolean
}

export interface Ticket {
  id: number
  spotId: number
  vehicle: Vehicle
  enteredAt: number
}

export interface SpotStrategy {
  pick(spots: Spot[], v: Vehicle): Spot | null
}

/** Take the first free spot that fits. Simple, but a motorcycle can waste a truck spot. */
export class NearestFree implements SpotStrategy {
  pick(spots: Spot[], v: Vehicle): Spot | null {
    return spots.find((s) => !s.taken && s.size >= v.size) ?? null
  }
}

/** Take the smallest free spot that fits, so big spots stay free for big vehicles. */
export class TightestFit implements SpotStrategy {
  pick(spots: Spot[], v: Vehicle): Spot | null {
    let best: Spot | null = null
    for (const s of spots) {
      if (s.taken || s.size < v.size) continue
      if (!best || s.size < best.size) best = s
    }
    return best
  }
}

export interface Pricing {
  fee(t: Ticket, now: number): number
}

/** Minutes are rounded up to whole hours, with a one-hour minimum. */
export class HourlyBySize implements Pricing {
  constructor(private rates: Record<Size, number>) {}

  fee(t: Ticket, now: number): number {
    const hours = Math.max(1, Math.ceil((now - t.enteredAt) / 60))
    return hours * this.rates[t.vehicle.size]
  }
}

export class ParkingLot {
  private tickets = new Map<number, Ticket>()
  private nextId = 1

  constructor(
    private spots: Spot[], // [1] the lot owns the spots and is handed its two rules
    private strategy: SpotStrategy,
    private pricing: Pricing,
  ) {}

  park(v: Vehicle, now: number): Ticket | null {
    const spot = this.strategy.pick(this.spots, v) // [2] ask the strategy, never choose here
    if (!spot) return null
    spot.taken = true // [3] mark the spot taken and issue a ticket
    const ticket = { id: this.nextId++, spotId: spot.id, vehicle: v, enteredAt: now }
    this.tickets.set(ticket.id, ticket)
    return ticket
  }

  unpark(ticketId: number, now: number): number | null {
    const ticket = this.tickets.get(ticketId)
    if (!ticket) return null
    const fee = this.pricing.fee(ticket, now) // [4] price it, free the spot, retire the ticket
    this.spots[ticket.spotId].taken = false
    this.tickets.delete(ticketId)
    return fee
  }
}
