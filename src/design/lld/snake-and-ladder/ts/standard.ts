/** Where rolls come from. Tests hand in a script, a real game hands in a random one. */
export interface Dice {
  roll(): number
}

/** Returns the given rolls one by one and throws when they run out. */
export class ScriptedDice implements Dice {
  private next = 0

  constructor(private rolls: number[]) {}

  roll(): number {
    if (this.next >= this.rolls.length) throw new Error('the scripted dice ran out of rolls')
    return this.rolls[this.next++]
  }
}

/** Squares are 1..size. Every snake and ladder is one entry: head square -> tail square. */
export class Board {
  constructor(
    readonly size: number,
    private jumps: Map<number, number>,
  ) {}

  /** One jump at most: the tail is final, even if it is the head of another jump. The last square never jumps. */
  settle(square: number): number {
    return square === this.size ? square : (this.jumps.get(square) ?? square)
  }
}

export class Player {
  pos = 0 // 0 means "not on the board yet"

  constructor(readonly name: string) {}
}

export class Game {
  winner: Player | null = null
  private turn = 0

  constructor(
    readonly board: Board, // [1] the game owns the board and the players, and is handed its dice
    readonly players: Player[],
    private dice: Dice,
  ) {}

  /** One turn for the player whose turn it is. Returns where they stand now, or null when the game is over. */
  play(): number | null {
    if (this.winner) return null
    const p = this.players[this.turn]
    const target = p.pos + this.dice.roll() // [2] ask the dice, never roll here
    if (target <= this.board.size) p.pos = this.board.settle(target) // [3] exact landing only; a roll that overshoots changes nothing
    if (p.pos === this.board.size) this.winner = p // [4] reaching the last square wins, otherwise the turn passes on
    else this.turn = (this.turn + 1) % this.players.length
    return p.pos
  }
}
