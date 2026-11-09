import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Bucket, type Panel, type SeqMessage } from '../../../../core/panels'
import { DirNode, FileNode, FileSystem, FsError, parse } from './standard'

// Replays operations against a real FileSystem. The find and mkdir methods of DirNode and FileNode are wrapped
// for the length of the run, so the sequence diagram shows the calls that really happened, level by level.
const ACTORS = ['Caller', 'FileSystem', 'Dir', 'File']
const SHORT: Record<string, string> = { addContentToFile: 'add', readContent: 'read' }
const show = (parts: string[]) => (parts.length ? parts.join('/') : '[]')

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const out: unknown[] = []
  const callers = ['FileSystem'] // who is making the current call, innermost last
  let fs!: FileSystem

  const traced = <T>(to: string, label: string, fn: () => T): T => {
    log.push({ from: callers[callers.length - 1], to, label })
    callers.push(to)
    try {
      return fn()
    } finally {
      callers.pop()
    }
  }
  const dirFind = DirNode.prototype.find
  const fileFind = FileNode.prototype.find
  const dirMkdir = DirNode.prototype.mkdir
  DirNode.prototype.find = function (this: DirNode, parts) { return traced('Dir', `find(${show(parts)})`, () => dirFind.call(this, parts)) }
  FileNode.prototype.find = function (this: FileNode, parts) { return traced('File', `find(${show(parts)})`, () => fileFind.call(this, parts)) }
  DirNode.prototype.mkdir = function (this: DirNode, parts) { return traced('Dir', `mkdir(${show(parts)})`, () => dirMkdir.call(this, parts)) }

  const diagram = (): Panel => seq(ACTORS, log, { label: 'calls in this request' })
  const sizeOf = (n: FileNode | DirNode) => (n instanceof FileNode ? `${n.name} (${n.content.length})` : `${n.name}/`)
  const rowsOf = (): Bucket[] => {
    const rows: Bucket[] = []
    const walk = (d: DirNode, path: string) => {
      const kids = [...d.children.values()].sort((a, b) => (a.name < b.name ? -1 : 1)) as (FileNode | DirNode)[]
      rows.push({ key: path, items: kids.length ? kids.map(sizeOf) : ['(empty)'] })
      for (const k of kids) if (k instanceof DirNode) walk(k, path === '/' ? `/${k.name}` : `${path}/${k.name}`)
    }
    walk(fs.root, '/')
    return rows
  }
  const listing = (hot: string[] = []): Panel =>
    buckets(rowsOf().map((r) => ({ ...r, tone: hot.includes(r.key) ? ('focus' as const) : undefined })), { label: 'the tree: one row per directory. name/ is a directory, name (n) is a file with n characters', keyLabel: 'directory' })
  const dirKeys = () => rowsOf().map((r) => r.key)
  // Reads the tree without calling find, so the sequence diagram only holds the operation's own calls.
  const lookup = (path: string): FileNode | DirNode | undefined => {
    let cur: FileNode | DirNode | undefined = fs.root
    for (const p of parse(path)) cur = cur instanceof DirNode ? (cur.children.get(p) as FileNode | DirNode | undefined) : undefined
    return cur
  }
  const onPath = (path: string): string[] => {
    try {
      const p = parse(path)
      return p.map((_, k) => '/' + p.slice(0, k + 1).join('/')).concat('/')
    } catch {
      return []
    }
  }
  const segments = (path: string): Panel => {
    try {
      const p = parse(path)
      return arr(p.length ? p : ['(root)'], { label: `"${path}" splits into segments`, tones: p.map(() => 'keep' as const) })
    } catch {
      return arr(['invalid'], { label: `"${path}" is refused`, tones: ['miss'] })
    }
  }
  const messy = (path: string) => {
    try {
      const p = parse(path)
      return path !== '/' + p.join('/')
    } catch {
      return true
    }
  }
  const bad = (m: string) => m === 'invalid path'

  try {
    ops.forEach((op, i) => {
      const a = args[i]
      log.length = 0
      if (op === 'FileSystem') {
        fs = new FileSystem()
        t.step(3, 'A file system is one root directory. Every path is followed down from it, one segment at a time.', [listing(['/'])])
        out.push(null)
        return
      }
      const path = a[0] as string
      const before = dirKeys()
      let res: unknown
      let err = ''
      log.push({ from: 'Caller', to: 'FileSystem', label: `${SHORT[op] ?? op}(${a.map((x) => (typeof x === 'string' && x.length > 14 ? '..' + x.slice(-12) : x)).join(', ')})` })
      try {
        if (op === 'mkdir') res = fs.mkdir(path) ? 1 : 0
        else if (op === 'ls') res = fs.ls(path)
        else if (op === 'addContentToFile') res = fs.addContentToFile(path, a[1] as string)
        else if (op === 'readContent') res = fs.readContent(path)
        else if (op === 'delete') res = fs.delete(path)
        else if (op === 'move') { fs.move(path, a[1] as string); res = 1 }
      } catch (e) {
        if (!(e instanceof FsError)) throw e
        err = e.message
        res = 'err: ' + err
      }
      const text = Array.isArray(res) ? `[${res.join(', ')}]` : typeof res === 'string' && res.length > 12 ? res.slice(0, 11) + '..' : String(res)
      log.push({ from: 'FileSystem', to: 'Caller', label: err || text, dashed: true, tone: err ? 'miss' : 'hit' })
      const hot = onPath(path)

      if (messy(path) || bad(err)) {
        t.step(1, bad(err) ? `"${path}" is refused: paths must start with "/" and may not contain "." or "..".` : `"${path}" is cleaned first: empty segments from "//" or a trailing "/" are dropped, so it means the same as "/${parse(path).join('/')}". The root is the empty list.`, [segments(path), listing()])
        if (bad(err)) { out.push(res); return }
      }
      if (op === 'mkdir') {
        const made = dirKeys().filter((k) => !before.includes(k))
        t.step(3, err ? `A file already sits on the path, so mkdir stops: ${err}.` : made.length ? `Each level is asked to create the next missing directory, parents first. New: ${made.join(', ')}.` : 'Every directory on the path already existed, so nothing is created and the answer is 0.', [diagram(), listing(hot)])
      } else if (op === 'ls') {
        t.step(2, err ? `The search ends early: ${err}.` : lookup(path) instanceof FileNode ? `The path leads to a file. ls of a file lists just that file's own name.` : `The path leads to a directory, so ls lists its children's names, sorted: ${show(res as string[])}.`, [diagram(), listing(hot)])
      } else if (op === 'addContentToFile' || op === 'readContent') {
        t.step(4, err ? `The write or read stops: ${err}.` : op === 'readContent' ? `The search reaches the file and returns its text.` : `The parent directory is found, then the text is appended to the file, which is created if missing. The new length is ${res}.`, [diagram(), listing(hot)])
      } else if (op === 'delete') {
        t.step(5, err ? `Nothing is removed: ${err}.` : `The parent forgets the child. The whole subtree goes with it, and count() added up ${res} node${res === 1 ? '' : 's'} on the way, each level asking its children.`, [diagram(), listing(hot)])
      } else if (op === 'move') {
        t.step(5, err ? `Nothing moves: ${err}.` : `The node is detached from its old parent and attached to the new one under its new name. Its children go along, because they hang off the node and are not copied.`, [diagram(), listing(onPath(a[1] as string))])
      }
      out.push(res)
    })
  } finally {
    DirNode.prototype.find = dirFind
    FileNode.prototype.find = fileFind
    DirNode.prototype.mkdir = dirMkdir
  }
  return out
}
