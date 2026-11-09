// Distance is whole grid units, money is whole cents. A refused operation returns false, -1 or "none" and changes nothing.
export interface Point {
  x: number
  y: number
}
export const manhattan = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

export type TripState = 'Requested' | 'Matched' | 'InProgress' | 'Completed' | 'Cancelled'

/** The only legal moves. A move that is not listed here is refused. */
const NEXT: Record<TripState, TripState[]> = {
  Requested: ['Matched', 'Cancelled'],
  Matched: ['InProgress', 'Cancelled'],
  InProgress: ['Completed'], // once the ride has started, it cannot be cancelled
  Completed: [],
  Cancelled: [],
}

export class Driver {
  constructor(readonly id: string, public at: Point, public online = true, public busy = false) {}
  get free(): boolean {
    return this.online && !this.busy
  }
}

export class Trip {
  state: TripState = 'Requested'
  driverId = ''
  constructor(readonly id: number, readonly rider: string, readonly from: Point, readonly to: Point, readonly surgePercent: number) {}

  move(next: TripState): boolean {
    if (!NEXT[this.state].includes(next)) return false // [3] the table decides, so no caller can skip a step
    this.state = next
    return true
  }
}

/** Chooses a driver for a pickup point. Returns null when nobody is free. */
export interface MatchingStrategy {
  pick(drivers: Driver[], from: Point): Driver | null
}

/** Closest free driver by Manhattan distance. Ties go to the smaller driver id, whatever the list order. */
export class NearestDriver implements MatchingStrategy {
  pick(drivers: Driver[], from: Point): Driver | null {
    let best: Driver | null = null
    let bestDist = 0
    for (const d of drivers) {
      if (!d.free) continue
      const dist = manhattan(d.at, from)
      if (!best || dist < bestDist || (dist === bestDist && d.id < best.id)) {
        best = d
        bestDist = dist
      }
    }
    return best
  }
}

/** Ignores distance: the free driver with the smallest id. The naive baseline. */
export class FirstFree implements MatchingStrategy {
  pick(drivers: Driver[]): Driver | null {
    let best: Driver | null = null
    for (const d of drivers) if (d.free && (!best || d.id < best.id)) best = d
    return best
  }
}

/** surgePercent is 100 for normal pricing, 150 for 1.5 times. */
export interface FareStrategy {
  fare(distance: number, surgePercent: number): number
}

export class DistanceFare implements FareStrategy {
  constructor(private base: number, private perUnit: number) {}
  fare(distance: number, surgePercent: number): number {
    return Math.floor(((this.base + this.perUnit * distance) * surgePercent) / 100) // whole cents, rounded down
  }
}

export class CabService {
  private drivers = new Map<string, Driver>() // insertion order
  private trips = new Map<number, Trip>() // insertion order is request order
  private nextId = 1

  constructor(private matcher: MatchingStrategy, private fares: FareStrategy) {}

  addDriver(id: string, at: Point): boolean {
    if (this.drivers.has(id)) return false
    this.drivers.set(id, new Driver(id, at))
    this.dispatch()
    return true
  }

  /** Go online or offline. Refused for an unknown driver, or one who is on a trip. */
  setAvailable(id: string, online: boolean): boolean {
    const d = this.drivers.get(id)
    if (!d || d.busy) return false
    d.online = online
    if (online) this.dispatch()
    return true
  }

  /** Always creates a trip. It stays Requested until a driver is free. */
  requestRide(rider: string, from: Point, to: Point, surgePercent: number): number {
    const trip = new Trip(this.nextId++, rider, from, to, surgePercent) // [1] a new trip starts as Requested, with its surge locked in
    this.trips.set(trip.id, trip)
    this.dispatch()
    return trip.id
  }

  startTrip(id: number): boolean {
    return this.trips.get(id)?.move('InProgress') ?? false
  }

  /** The fare in cents, or -1 if the trip is not in progress. */
  endTrip(id: number): number {
    const trip = this.trips.get(id)
    if (!trip || !trip.move('Completed')) return -1
    const fare = this.fares.fare(manhattan(trip.from, trip.to), trip.surgePercent) // [4] price it by the pluggable formula
    this.release(trip.driverId, trip.to) // the driver is now at the drop-off
    return fare
  }

  cancel(id: number): boolean {
    const trip = this.trips.get(id)
    if (!trip || !trip.move('Cancelled')) return false
    if (trip.driverId) {
      const d = this.drivers.get(trip.driverId)!
      trip.driverId = ''
      this.release(d.id, d.at) // the driver never moved
    }
    return true
  }

  /** "Matched:d2", "Requested", or "none" for an unknown trip. */
  status(id: number): string {
    const t = this.trips.get(id)
    return t ? t.state + (t.driverId ? ':' + t.driverId : '') : 'none'
  }

  private release(driverId: string, at: Point): void {
    const d = this.drivers.get(driverId)!
    d.busy = false // [5] free the driver where the trip ended, then serve anyone waiting
    d.at = at
    this.dispatch()
  }

  /** Match waiting trips to free drivers, oldest request first. */
  private dispatch(): void {
    for (const trip of this.trips.values()) {
      if (trip.state !== 'Requested') continue
      const d = this.matcher.pick([...this.drivers.values()], trip.from) // [2] ask the strategy, never compare distances here
      if (!d) return // nobody is free, and a later trip would not change that
      trip.move('Matched')
      trip.driverId = d.id
      d.busy = true
    }
  }
}
