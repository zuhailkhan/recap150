export class FsError extends Error {}

/** Composite: a file and a directory answer the same questions, so the caller never asks which one it holds. */
export interface FsNode {
  name: string
  count(): number // nodes in this subtree, itself included
  find(parts: string[]): FsNode // follow the path segments down from here
}

export class FileNode implements FsNode {
  content = ''

  constructor(public name: string) {}

  count(): number {
    return 1
  }

  find(parts: string[]): FsNode {
    if (parts.length > 0) throw new FsError('not a directory') // nothing lives below a file
    return this
  }
}

export class DirNode implements FsNode {
  readonly children = new Map<string, FsNode>()

  constructor(public name: string) {}

  count(): number {
    let n = 1
    for (const child of this.children.values()) n += child.count()
    return n
  }

  find(parts: string[]): FsNode {
    if (parts.length === 0) return this
    const [head, ...rest] = parts
    const child = this.children.get(head)
    if (!child) throw new FsError('not found')
    return child.find(rest) // [2] each level hands the rest of the path to the next node
  }

  /** Creates every missing directory on the way. Returns true if it created anything. */
  mkdir(parts: string[]): boolean {
    if (parts.length === 0) return false
    const [head, ...rest] = parts
    let child = this.children.get(head)
    let created = false
    if (!child) {
      child = new DirNode(head)
      this.children.set(head, child) // [3] a missing level is created, parents first
      created = true
    }
    if (!(child instanceof DirNode)) throw new FsError('not a directory')
    return child.mkdir(rest) || created
  }
}

/** "/a//b/" and "/a/b" are the same place. Only absolute paths are allowed, and "." and ".." are refused. */
export function parse(path: string): string[] {
  if (!path.startsWith('/')) throw new FsError('invalid path')
  const parts = path.split('/').filter((p) => p !== '') // [1] drop empty segments: root is []
  if (parts.some((p) => p === '.' || p === '..')) throw new FsError('invalid path')
  return parts
}

export class FileSystem {
  readonly root = new DirNode('')

  mkdir(path: string): boolean {
    return this.root.mkdir(parse(path))
  }

  /** A directory lists its children's names, sorted. A file lists just itself. */
  ls(path: string): string[] {
    const node = this.root.find(parse(path))
    return node instanceof DirNode ? [...node.children.keys()].sort() : [node.name]
  }

  /** Appends to the file, creating it when missing. The parent directory must exist. Returns the new length. */
  addContentToFile(path: string, text: string): number {
    const [dir, name] = this.parentOf(parse(path))
    let file = dir.children.get(name)
    if (!file) dir.children.set(name, (file = new FileNode(name)))
    if (!(file instanceof FileNode)) throw new FsError('is a directory')
    file.content += text // [4] a file is the only node that holds text
    return file.content.length
  }

  readContent(path: string): string {
    const node = this.root.find(parse(path))
    if (!(node instanceof FileNode)) throw new FsError('is a directory')
    return node.content // [4]
  }

  /** Removes a file, or a directory with everything under it. Returns how many nodes went. */
  delete(path: string): number {
    const [dir, name] = this.parentOf(parse(path))
    const node = dir.children.get(name)
    if (!node) throw new FsError('not found')
    dir.children.delete(name) // [5] detach from the parent, and the whole subtree goes with it
    return node.count()
  }

  /** Renames or moves a file or directory to a new full path that must not exist yet. */
  move(from: string, to: string): void {
    const src = parse(from)
    const dst = parse(to)
    if (dst.length > src.length && src.every((p, i) => p === dst[i])) throw new FsError('cannot move into itself')
    const [srcDir, srcName] = this.parentOf(src)
    const node = srcDir.children.get(srcName)
    if (!node) throw new FsError('not found')
    const [dstDir, dstName] = this.parentOf(dst)
    if (dstDir.children.has(dstName)) throw new FsError('already exists')
    srcDir.children.delete(srcName) // [5] detach here, attach there. The node and its subtree are not copied
    node.name = dstName
    dstDir.children.set(dstName, node)
  }

  /** The directory that holds the last segment, and that segment. The root has no parent. */
  private parentOf(parts: string[]): [DirNode, string] {
    if (parts.length === 0) throw new FsError('invalid path')
    const dir = this.root.find(parts.slice(0, -1))
    if (!(dir instanceof DirNode)) throw new FsError('not a directory')
    return [dir, parts[parts.length - 1]]
  }
}
