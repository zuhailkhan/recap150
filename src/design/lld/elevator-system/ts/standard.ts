// Floors are integers from 0 (ground). Time is whole ticks: every tick() moves each elevator one floor
// or takes one door step. Nothing here reads a clock or uses randomness, so a run always replays the same way.
export type State = 'Idle' | 'MovingUp' | 'MovingDown' | 'DoorsOpen'
export type Call = 'up' | 'down' // the button pressed in the hall: the direction the rider wants to go
type Dir = -1 | 0 | 1

export class Elevator {
  state: State = 'Idle'
  dir: Dir = 0 // the way it is travelling, 0 when it has no direction
  readonly car = new Set<number>() // floors pressed inside the car
  readonly up = new Set<number>() // hall calls from riders who want to go up
  readonly down = new Set<number>() // hall calls from riders who want to go down

  constructor(readonly id: number, public floor: number) {}

  add(floor: number, kind: 'car' | Call): void {
    ;(kind === 'car' ? this.car : kind === 'up' ? this.up : this.down).add(floor) // [3] remember the stop
  }

  /** Every floor with a call or a car button, lowest first. */
  pending(): number[] {
    return [...new Set([...this.car, ...this.up, ...this.down])].sort((a, b) => a - b)
  }

  /** One tick. Returns true when the doors opened on this tick. */
  step(): boolean {
    switch (this.state) {
      case 'Idle': {
        const p = this.pending()
        if (p.length === 0) return false
        if (p.includes(this.floor)) return this.open(true) // someone is calling right here
        this.dir = this.pickDir()
        this.state = this.dir > 0 ? 'MovingUp' : 'MovingDown'
        return this.move()
      }
      case 'MovingUp':
      case 'MovingDown':
        return this.move()
      case 'DoorsOpen':
        this.dir = this.pickDir() // [6] doors close: keep the direction if work is ahead, else turn round, else idle
        this.state = this.dir > 0 ? 'MovingUp' : this.dir < 0 ? 'MovingDown' : 'Idle'
        return false
    }
  }

  private move(): boolean {
    this.floor += this.dir
    const f = this.floor
    const wanted = this.car.has(f) || (this.dir > 0 ? this.up : this.down).has(f)
    const last = !this.pending().some((p) => (p - f) * this.dir > 0) && this.pending().includes(f)
    if (!wanted && !last) return false // [5] pass floors where nobody is waiting to go our way
    return this.open(last) // at the last stop in this direction, answer every call here
  }

  private open(all: boolean): true {
    const f = this.floor
    this.car.delete(f)
    if (all || this.dir > 0) this.up.delete(f)
    if (all || this.dir < 0) this.down.delete(f)
    this.state = 'DoorsOpen'
    return true
  }

  /** Keep going the way we were going while there is work ahead. Otherwise turn round, or stop. */
  private pickDir(): Dir {
    const p = this.pending()
    const above = p.filter((f) => f > this.floor)
    const below = p.filter((f) => f < this.floor)
    if (above.length && below.length) {
      if (this.dir !== 0) return this.dir
      return above[0] - this.floor <= this.floor - below[below.length - 1] ? 1 : -1 // no direction yet: nearest side, a tie goes up
    }
    return above.length ? 1 : below.length ? -1 : 0
  }
}

/** Chooses which elevator answers a hall call. It only reads the elevators. */
export interface Scheduler {
  pick(elevators: Elevator[], floor: number, call: Call): number
}

/** Send the nearest idle elevator. If none is idle, the nearest of all. Ties go to the lowest id. */
export class NearestIdle implements Scheduler {
  pick(elevators: Elevator[], floor: number): number {
    const idle = elevators.filter((e) => e.state === 'Idle')
    const pool = idle.length ? idle : elevators
    return pool.reduce((best, e) => (Math.abs(e.floor - floor) < Math.abs(best.floor - floor) ? e : best)).id
  }
}

/** Estimate the ticks each elevator needs, honouring its direction, and take the cheapest. Ties go to the lowest id. */
export class DirectionAware implements Scheduler {
  pick(elevators: Elevator[], floor: number, call: Call): number {
    let best = elevators[0]
    for (const e of elevators) if (this.cost(e, floor, call) < this.cost(best, floor, call)) best = e
    return best.id
  }

  private cost(e: Elevator, floor: number, call: Call): number {
    const queued = 2 * e.pending().length // each stop costs about two ticks of door time
    if (e.dir === 0) return Math.abs(e.floor - floor) + queued
    const sameWay = (call === 'up') === e.dir > 0
    if (sameWay && (floor - e.floor) * e.dir > 0) return Math.abs(floor - e.floor) + queued // on its way, going our way
    const turn = e.dir > 0 ? Math.max(e.floor, ...e.pending()) : Math.min(e.floor, ...e.pending()) // it must finish its sweep first
    return Math.abs(turn - e.floor) + Math.abs(turn - floor) + queued
  }
}

export class Building {
  tickNo = 0
  readonly log: string[] = [] // "t<tick>:e<id>@<floor>" each time a door opens

  constructor(
    readonly floors: number, // [1] the building owns its elevators and is handed the scheduling rule
    readonly elevators: Elevator[],
    private scheduler: Scheduler,
  ) {}

  /** The elevator that will answer, or -1 for a floor that does not exist or a button the floor does not have. */
  hall(floor: number, call: Call): number {
    if (floor < 0 || floor >= this.floors) return -1
    if ((call === 'up' && floor === this.floors - 1) || (call === 'down' && floor === 0)) return -1
    const id = this.scheduler.pick(this.elevators, floor, call) // [2] ask the scheduler, never choose here
    this.elevators[id].add(floor, call)
    return id
  }

  /** A rider inside elevator `id` presses a floor button. False for an unknown elevator or floor. */
  press(id: number, floor: number): boolean {
    if (id < 0 || id >= this.elevators.length || floor < 0 || floor >= this.floors) return false
    this.elevators[id].add(floor, 'car')
    return true
  }

  tick(): void {
    this.tickNo++
    for (const e of this.elevators) if (e.step()) this.log.push(`t${this.tickNo}:e${e.id}@${e.floor}`) // [4] every elevator takes one step, in id order
  }
}
