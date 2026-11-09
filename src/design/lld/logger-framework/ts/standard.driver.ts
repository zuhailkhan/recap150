import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import {
  BrokenAppender, ConsoleAppender, DropContaining, FileAppender, FullFormat, LEVELS, Logger, MemoryAppender, ShortFormat,
  type Appender, type Filter, type Formatter, type Level, type LogRecord,
} from './standard'

// Replays operations against a real Logger. Appenders, formatters and filters are wrapped in spies, so
// the sequence diagram shows calls that really happened. Time is a number the driver sets before each call.
// Logger args: starting level, then appender specs [kind, format, optional max lines].
const ACTORS = ['Caller', 'Logger', 'Filter', 'Appender', 'Formatter']

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const consoleLines: string[] = []
  let now = 0
  let logger!: Logger
  let memory: MemoryAppender | undefined
  let file: FileAppender | undefined
  let words: string[] = []
  let kinds: string[] = []
  const out: unknown[] = []

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const rank = (l: string): number => LEVELS.indexOf(l as Level)
  const levelsPanel = (hot?: string): Panel =>
    arr([...LEVELS], {
      label: 'levels, lowest to highest (grey = dropped, blue = the logger level)',
      tones: LEVELS.map((_, i) => (i < rank(logger.level) ? ('dim' as const) : i === rank(logger.level) ? ('focus' as const) : null)),
      pointers: hot ? [{ name: 'record', at: rank(hot), tone: rank(hot) >= rank(logger.level) ? ('hit' as const) : ('miss' as const) }] : [],
    })
  const outputsPanel = (): Panel => {
    const bs = []
    if (kinds.includes('console')) bs.push({ key: 'console', items: [...consoleLines] })
    if (memory) bs.push({ key: 'memory', items: [...memory.lines] })
    if (file) file.files.forEach((f, n) => bs.push({ key: `file ${n + 1}`, items: [...f] }))
    if (kinds.includes('broken')) bs.push({ key: 'broken', items: [], tone: 'miss' as const })
    return buckets(bs, { label: 'what each appender holds', keyLabel: 'appender', empty: 'no appenders' })
  }

  const formatSpy = (inner: Formatter): Formatter => ({
    format(r: LogRecord) {
      log.push({ from: 'Appender', to: 'Formatter', label: 'format(record)' })
      const line = inner.format(r)
      log.push({ from: 'Formatter', to: 'Appender', label: line, dashed: true, tone: 'focus' })
      return line
    },
  })
  const appenderSpy = (inner: Appender): Appender => ({
    name: inner.name,
    write(r: LogRecord) {
      log.push({ from: 'Logger', to: 'Appender', label: `write → ${inner.name}` })
      try {
        inner.write(r)
      } catch (e) {
        log.push({ from: 'Appender', to: 'Logger', label: 'throws', dashed: true, tone: 'miss' })
        throw e
      }
    },
  })
  const filterSpy = (inner: Filter, word: string): Filter => ({
    allow(r: LogRecord) {
      log.push({ from: 'Logger', to: 'Filter', label: `allow("${r.msg}")` })
      const ok = inner.allow(r)
      log.push({ from: 'Filter', to: 'Logger', label: ok ? `yes, no "${word}"` : `no, has "${word}"`, dashed: true, tone: ok ? 'hit' : 'miss' })
      return ok
    },
  })

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Logger') {
      const specs = a[1] as [string, string, number?][]
      kinds = specs.map((s) => s[0])
      words = []
      memory = undefined
      file = undefined
      consoleLines.length = 0
      const apps: Appender[] = specs.map(([kind, format, max]) => {
        const fmt = formatSpy(format === 'full' ? new FullFormat() : new ShortFormat())
        if (kind === 'console') return appenderSpy(new ConsoleAppender(fmt, (line) => consoleLines.push(line)))
        if (kind === 'memory') return appenderSpy((memory = new MemoryAppender(fmt)))
        if (kind === 'file') return appenderSpy((file = new FileAppender(fmt, max ?? 100)))
        return appenderSpy(new BrokenAppender())
      })
      logger = new Logger(a[0] as Level, () => now, apps)
      t.step(1, `A logger at level ${logger.level} with ${apps.length} appender${apps.length === 1 ? '' : 's'}: ${kinds.join(', ') || 'none'}. It owns the level, an empty filter chain and the list. Each appender brings its own formatter.`, [levelsPanel(), outputsPanel()])
      out.push(null)
    } else if (op === 'log') {
      const [level, msg, time] = a as [Level, string, number]
      now = time
      const before = logger.failures.length
      log.push({ from: 'Caller', to: 'Logger', label: `log(${level}, "${msg}")` })
      const n = logger.log(level, msg)
      const failed = logger.failures.slice(before)
      log.push({ from: 'Logger', to: 'Caller', label: `${n} written`, dashed: true, tone: n ? 'hit' : 'miss' })
      const belowLevel = rank(level) < rank(logger.level)
      t.step(2, belowLevel ? `${level} is below ${logger.level}, so the logger drops it at once. No record is built and no filter or appender is called.` : `${level} is at or above ${logger.level}, so the record passes the level check. The logger stamps it with the clock: time ${time}.`, [diagram(belowLevel ? log.length : 1), levelsPanel(level)])
      if (belowLevel) {
        out.push(n)
        return
      }
      const filterEnd = Math.max(...log.map((m, k) => (m.to === 'Filter' || m.from === 'Filter' ? k + 1 : 0)))
      if (filterEnd > 0) {
        const stopped = log.some((m) => m.from === 'Filter' && m.tone === 'miss')
        t.step(3, stopped ? 'A filter in the chain said no. The chain stops there and the record goes nowhere.' : 'Every filter in the chain said yes, so the record goes on to the appenders.', [diagram(stopped ? log.length : filterEnd), levelsPanel(level)])
        if (stopped) {
          out.push(n)
          return
        }
      }
      if (failed.length) {
        const firstThrow = log.findIndex((m) => m.label === 'throws')
        t.step(4, 'The logger hands the same record to each appender in registration order. Each one formats it with its own formatter.', [diagram(firstThrow + 1)])
        t.step(5, `${failed.join(' and ')} threw. The logger noted it and went on, so the other appenders still got the line. ${n} of ${kinds.length} written.`, [diagram(), outputsPanel()])
      } else {
        t.step(4, `The logger hands the same record to each appender in registration order. Each formats it with its own formatter, so the same event reads differently in each place.`, [diagram(), outputsPanel()])
      }
      out.push(n)
    } else if (op === 'setLevel') {
      const prev = logger.level
      logger.level = a[0] as Level
      log.push({ from: 'Caller', to: 'Logger', label: `level = ${logger.level}` })
      t.step(2, `The level changes from ${prev} to ${logger.level} while the logger lives. The next call uses the new level. Nothing else is rebuilt.`, [diagram(), levelsPanel()])
      out.push(prev)
    } else if (op === 'addFilter') {
      const word = a[0] as string
      words.push(word)
      logger.addFilter(filterSpy(new DropContaining(word), word))
      log.push({ from: 'Caller', to: 'Logger', label: `addFilter("${word}")` })
      t.step(3, `A filter that drops messages containing "${word}" joins the end of the chain. The chain now has ${words.length} filter${words.length === 1 ? '' : 's'}.`, [diagram(), levelsPanel()])
      out.push(1)
    } else if (op === 'lines') {
      const lines = a[0] === 'console' ? [...consoleLines] : [...(memory?.lines ?? [])]
      t.step(4, `Reading what the ${a[0]} appender holds: ${lines.length} line${lines.length === 1 ? '' : 's'}.`, [outputsPanel()])
      out.push(lines)
    } else if (op === 'files') {
      t.step(4, `The file appender started ${file!.files.length} file${file!.files.length === 1 ? '' : 's'}. A new one begins when the current one is full.`, [outputsPanel()])
      out.push(file!.files.map((f) => [...f]))
    } else if (op === 'failures') {
      t.step(5, logger.failures.length ? `Appenders that threw so far: ${logger.failures.join(', ')}.` : 'No appender has thrown.', [arr([...logger.failures], { label: 'failures, in order' }), outputsPanel()])
      out.push([...logger.failures])
    }
  })
  return out
}
