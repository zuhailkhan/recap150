// Songs have ids 1, 2, 3... A playlist is a named list of song ids. Every transport call returns the id of the
// current song after it, or -1 when the call was ignored in the current state.
export class Library {
  private lists: Map<string, number[]>

  constructor(private titles: string[], lists: Map<string, number[]>) {
    this.lists = lists
  }

  has(id: number): boolean {
    return Number.isInteger(id) && id >= 1 && id <= this.titles.length
  }

  title(id: number): string {
    return this.titles[id - 1]
  }

  playlist(name: string): number[] | null {
    return this.lists.get(name)?.slice() ?? null
  }
}

/** Reorders a list. Injected, so tests can use a seeded one and a real app a random one. */
export type Shuffle = (xs: number[]) => number[]

/** Fisher-Yates driven by a small linear congruential generator. The same seed gives the same order in every language. */
export function seededShuffle(seed: number): Shuffle {
  let s = seed >>> 0
  return (xs) => {
    const a = [...xs]
    for (let i = a.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0
      const j = s % (i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}

/** Where to go from position pos of len songs. -1 means the queue is over. */
export interface RepeatMode {
  next(pos: number, len: number, ended: boolean): number // ended = the song finished by itself, not skipped
  prev(pos: number, len: number): number
}

export class RepeatOff implements RepeatMode {
  next(pos: number, len: number, _ended?: boolean): number {
    return pos + 1 < len ? pos + 1 : -1
  }
  prev(pos: number): number {
    return Math.max(pos - 1, 0)
  }
}

/** A finished song plays again. A skip still moves on, and stops after the last song. */
export class RepeatOne extends RepeatOff {
  next(pos: number, len: number, ended: boolean): number {
    return ended ? pos : super.next(pos, len)
  }
}

export class RepeatAll implements RepeatMode {
  next(pos: number, len: number): number {
    return (pos + 1) % len
  }
  prev(pos: number, len: number): number {
    return (pos + len - 1) % len
  }
}

/** The iterator over what plays. Callers ask for next and previous, never for an index. */
export class PlayQueue {
  private songs: number[] = [] // song ids in the order they were added
  private order: number[] = [] // positions in songs, in play order. Shuffle reorders this, not songs
  private pos = 0 // where we are in order
  private shuffled = false

  constructor(private shuffle: Shuffle, public repeat: RepeatMode) {}

  get size(): number {
    return this.order.length
  }
  get position(): number {
    return this.pos
  }

  current(): number | null {
    return this.songs[this.order[this.pos]] ?? null
  }

  playOrder(): number[] {
    return this.order.map((i) => this.songs[i])
  }

  load(ids: number[]): void {
    this.songs = [...ids]
    this.order = ids.map((_, i) => i)
    this.pos = 0
    this.shuffled = false
  }

  add(id: number): void {
    this.order.push(this.songs.push(id) - 1)
  }

  /** The next song, or null when the queue is over. */
  next(ended: boolean): number | null {
    const to = this.repeat.next(this.pos, this.order.length, ended) // [4] the repeat strategy picks the next position
    if (to < 0) return null
    this.pos = to
    return this.current()
  }

  prev(): number | null {
    this.pos = this.repeat.prev(this.pos, this.order.length)
    return this.current()
  }

  rewind(): void {
    this.pos = 0
  }

  /** On: the song playing now stays first and the rest are reordered. Off: back to the added order, same song. */
  setShuffle(on: boolean): void {
    if (on === this.shuffled) return
    this.shuffled = on
    if (this.order.length === 0) return
    if (on) {
      const rest = this.order.filter((_, i) => i !== this.pos)
      this.order = [this.order[this.pos], ...this.shuffle(rest)] // [5] current song first, the rest in the injected order
      this.pos = 0
    } else {
      this.pos = this.order[this.pos]
      this.order = this.songs.map((_, i) => i)
    }
  }
}

/** Every transport action. Each state answers all of them. true = accepted, false = ignored. */
export interface PlayerState {
  readonly name: string
  play(): boolean
  pause(): boolean
  stop(): boolean
  next(): boolean
  prev(): boolean
  ended(): boolean // the current song finished by itself
}

export type Mode = 'off' | 'one' | 'all'

/** The context. It owns the queue and forwards every action to the current state. */
export class Player {
  readonly stopped: PlayerState = new Stopped(this)
  readonly playing: PlayerState = new Playing(this)
  readonly paused: PlayerState = new Paused(this)
  readonly modes: Record<Mode, RepeatMode> = { off: new RepeatOff(), one: new RepeatOne(), all: new RepeatAll() }
  readonly queue: PlayQueue
  state: PlayerState

  constructor(private library: Library, shuffle: Shuffle) {
    this.queue = new PlayQueue(shuffle, this.modes.off) // [1] an empty queue, repeat off, and the player starts Stopped
    this.state = this.stopped
  }

  /** Replace the queue with a playlist and stop. Returns its length, or -1 if it is unknown or empty. */
  load(name: string): number {
    const ids = this.library.playlist(name)
    if (!ids || ids.length === 0) return -1
    this.queue.load(ids)
    this.state = this.stopped
    return ids.length
  }

  /** Add one song to the end of the queue. Returns the new length, or -1 for an unknown song. */
  enqueue(id: number): number {
    if (!this.library.has(id)) return -1
    this.queue.add(id)
    return this.queue.size
  }

  play(): number {
    return this.answer(this.state.play()) // [2] no if/else on state here: the current state decides
  }
  pause(): number {
    return this.answer(this.state.pause())
  }
  stop(): number {
    return this.answer(this.state.stop())
  }
  next(): number {
    return this.answer(this.state.next())
  }
  prev(): number {
    return this.answer(this.state.prev())
  }
  ended(): number {
    return this.answer(this.state.ended())
  }

  setRepeat(mode: Mode): void {
    this.queue.repeat = this.modes[mode]
  }
  setShuffle(on: boolean): void {
    this.queue.setShuffle(on)
  }
  current(): number {
    return this.queue.current() ?? -1
  }

  setState(s: PlayerState): void {
    this.state = s // [3] a state moves the player by naming the next state
  }
  /** Playback is over: go back to the first song and stop. */
  finish(): void {
    this.queue.rewind()
    this.setState(this.stopped)
  }

  private answer(accepted: boolean): number {
    return accepted ? this.current() : -1
  }
}

class Stopped implements PlayerState {
  readonly name = 'Stopped'
  constructor(private p: Player) {}

  play(): boolean {
    if (this.p.queue.size === 0) return false // nothing to play
    this.p.setState(this.p.playing)
    return true
  }
  pause(): boolean {
    return false
  }
  stop(): boolean {
    return false
  }
  next(): boolean {
    return false
  }
  prev(): boolean {
    return false
  }
  ended(): boolean {
    return false
  }
}

class Playing implements PlayerState {
  readonly name = 'Playing'
  constructor(private p: Player) {}

  play(): boolean {
    return false
  }
  pause(): boolean {
    this.p.setState(this.p.paused)
    return true
  }
  stop(): boolean {
    this.p.finish()
    return true
  }
  next(): boolean {
    return this.advance(false)
  }
  prev(): boolean {
    this.p.queue.prev()
    return true
  }
  ended(): boolean {
    return this.advance(true)
  }
  private advance(ended: boolean): boolean {
    if (this.p.queue.next(ended) === null) this.p.finish() // past the last song with repeat off
    return true
  }
}

class Paused implements PlayerState {
  readonly name = 'Paused'
  constructor(private p: Player) {}

  play(): boolean {
    this.p.setState(this.p.playing)
    return true
  }
  pause(): boolean {
    return false
  }
  stop(): boolean {
    this.p.finish()
    return true
  }
  next(): boolean {
    if (this.p.queue.next(false) === null) this.p.finish()
    else this.p.setState(this.p.playing) // skipping while paused starts the next song
    return true
  }
  prev(): boolean {
    this.p.queue.prev()
    this.p.setState(this.p.playing)
    return true
  }
  ended(): boolean {
    return false // a paused song cannot finish
  }
}
