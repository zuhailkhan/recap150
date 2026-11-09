/** Lowest to highest. A level's rank is its index, so a record passes when rank >= the logger's rank. */
export const LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const
export type Level = (typeof LEVELS)[number]

/** What one log call produced. The time comes from the injected clock, never from Date.now() here. */
export interface LogRecord {
  readonly level: Level
  readonly msg: string
  readonly time: number
}

/** Turns a record into one line of text. */
export interface Formatter {
  format(r: LogRecord): string
}
export class ShortFormat implements Formatter {
  format(r: LogRecord): string {
    return `${r.level}: ${r.msg}`
  }
}
export class FullFormat implements Formatter {
  format(r: LogRecord): string {
    return `[${r.time}] ${r.level} ${r.msg}`
  }
}

/** Where a line goes. write throws when the destination fails. */
export interface Appender {
  readonly name: string
  write(r: LogRecord): void
}

/** Prints through `out`, which is console.log unless a test swaps it. */
export class ConsoleAppender implements Appender {
  readonly name = 'console'

  constructor(
    private fmt: Formatter,
    private out: (line: string) => void = console.log,
  ) {}

  write(r: LogRecord): void {
    this.out(this.fmt.format(r))
  }
}

export class MemoryAppender implements Appender {
  readonly name = 'memory'
  readonly lines: string[] = []

  constructor(private fmt: Formatter) {}

  write(r: LogRecord): void {
    this.lines.push(this.fmt.format(r))
  }
}

/** A file stand-in: starts a new file once the current one holds maxLines. */
export class FileAppender implements Appender {
  readonly name = 'file'
  readonly files: string[][] = [[]]

  constructor(
    private fmt: Formatter,
    private maxLines: number,
  ) {}

  write(r: LogRecord): void {
    if (this.files[this.files.length - 1].length >= this.maxLines) this.files.push([])
    this.files[this.files.length - 1].push(this.fmt.format(r))
  }
}

/** A destination that is always down, for tests. */
export class BrokenAppender implements Appender {
  readonly name = 'broken'

  write(): void {
    throw new Error('destination is down')
  }
}

/** One link in the chain. Returning false stops the record: nothing after it runs. */
export interface Filter {
  allow(r: LogRecord): boolean
}
export class DropContaining implements Filter {
  constructor(private word: string) {}

  allow(r: LogRecord): boolean {
    return !r.msg.includes(this.word)
  }
}

export class Logger {
  readonly failures: string[] = [] // the name of every appender whose write threw

  constructor(
    public level: Level, // [1] the logger owns a level, a filter chain and a list of appenders; all can change later
    private clock: () => number,
    private appenders: Appender[],
    private filters: Filter[] = [],
  ) {}

  addFilter(f: Filter): void {
    this.filters.push(f)
  }

  /** Returns how many appenders took the record. 0 means it was dropped or every appender failed. */
  log(level: Level, msg: string): number {
    if (LEVELS.indexOf(level) < LEVELS.indexOf(this.level)) return 0 // [2] below the current level: drop it before doing any work
    const r: LogRecord = { level, msg, time: this.clock() }
    if (!this.filters.every((f) => f.allow(r))) return 0 // [3] the filter chain runs in order and the first "no" ends it
    let written = 0
    for (const a of this.appenders) {
      try {
        a.write(r) // [4] every appender gets the record, in registration order, and formats it its own way
        written++
      } catch {
        this.failures.push(a.name) // [5] one appender throwing must not stop the others
      }
    }
    return written
  }
}
