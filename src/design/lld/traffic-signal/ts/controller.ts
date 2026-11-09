// Time is whole ticks. The clock lives outside: whoever owns it calls Junction.tick() once per tick.
export type Color = 'green' | 'yellow' | 'red'
const NEXT: Record<Color, Color> = { green: 'yellow', yellow: 'red', red: 'green' }

/** One signal head for a pair of opposing directions (north and south show the same colour). */
export class Signal {
  color: Color = 'red'
  left = 0 // ticks until the next colour (not used while red)

  constructor(readonly name: string, private green: number, private yellow: number) {}

  go(): void {
    this.color = 'green'
    this.left = this.green
  }

  /** One tick. Returns true when the signal has just turned red. Red never counts: the junction decides when it ends. */
  tick(): boolean {
    if (this.color === 'red' || --this.left > 0) return false // [3] still counting down in this colour
    this.color = NEXT[this.color]
    this.left = this.color === 'yellow' ? this.yellow : 0
    return this.color === 'red'
  }
}

/** The pedestrian button and the walk phase. */
export class Crossing {
  waiting = false // someone has asked
  left = 0 // ticks of walk remaining

  constructor(readonly walk: number) {}

  get walking(): boolean {
    return this.left > 0
  }

  /** True if this press queued a new request. A second press, or one during the walk, adds nothing. */
  press(): boolean {
    if (this.waiting || this.walking || this.walk < 1) return false // [5] the button only records a request
    this.waiting = true
    return true
  }

  /** Called at the safe moment. Starts the walk if someone asked. */
  open(): boolean {
    if (!this.waiting) return false
    this.waiting = false
    this.left = this.walk
    return true
  }

  /** One tick of the walk. True when it has just ended. */
  tick(): boolean {
    return this.walking && --this.left === 0
  }
}

/** Owns the order of play. Only one axis is ever lit, so two opposing greens are impossible by construction. */
export class Junction {
  private active = 0

  constructor(private signals: Signal[], private crossing: Crossing) {
    this.signals[0].go() // [1] the first axis starts green, every other one is red
  }

  press(): boolean {
    return this.crossing.press()
  }

  tick(): void {
    // [2] one tick of the clock: exactly one thing moves, the walk or the active signal
    if (this.crossing.walking) {
      if (this.crossing.tick()) this.signals[this.active].go() // walk over: the next axis starts
      return
    }
    if (!this.signals[this.active].tick()) return
    this.active = (this.active + 1) % this.signals.length // [4] the active axis is red: the safe moment to hand over
    if (!this.crossing.open()) this.signals[this.active].go() // a waiting pedestrian goes first, otherwise the next axis
  }

  /** The invariant: at most one axis is lit, and nothing is lit during the walk. */
  safe(): boolean {
    const lit = this.signals.filter((s) => s.color !== 'red').length
    return lit <= 1 && !(lit === 1 && this.crossing.walking)
  }

  /** For example "NS:G EW:R", with " WALK" during the walk and " req" while a request waits. */
  look(): string {
    const lights = this.signals.map((s) => `${s.name}:${s.color[0].toUpperCase()}`).join(' ')
    return lights + (this.crossing.walking ? ' WALK' : '') + (this.crossing.waiting ? ' req' : '')
  }
}
