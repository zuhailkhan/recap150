import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { writing, reading } from './viz'

export interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

// Format: preorder, comma separated, "#" for a missing child. Example: "1,2,#,#,3,4,#,#,#"
export function serialize(root: TreeNode | null, t: Tracer = noop): string {
  const out: string[] = []
  const walk = (node: TreeNode | null): void => {
    if (!node) {
      out.push('#') // [1] a marker for "no child here"
      t.step(1, `Nothing here. Write # so the reader knows this child is missing.`, [writing('tree', null), arr(out, { label: 'tokens so far', tones: out.map((_, i): 'miss' | null => (i === out.length - 1 ? 'miss' : null)) })])
      return
    }
    out.push(String(node.val)) // [2] write the node, then its left side, then its right side
    t.step(2, `Write ${node.val}, then walk its left side, then its right side.`, [writing('tree', node), arr(out, { label: 'tokens so far', tones: out.map((_, i): 'focus' | null => (i === out.length - 1 ? 'focus' : null)) })])
    walk(node.left)
    walk(node.right)
  }
  walk(root)
  t.step(3, `All ${out.length} tokens are written. Join them with commas.`, [writing('tree', null), arr([out.join(',')], { label: 'serialized string', tones: ['hit'] })])
  return out.join(',') // [3] one string
}

export function deserialize(data: string, t: Tracer = noop): TreeNode | null {
  const tokens = data.split(',') // [4] back to tokens
  t.step(4, `Split the string at the commas to get ${tokens.length} tokens.`, [arr(tokens, { label: 'tokens', pointers: [{ name: 'next', at: 0 }] })])
  let next = 0
  const read = (): TreeNode | null => {
    const token = tokens[next++] // [5] take the next token. # means no node, otherwise make a node, then read its left, then its right
    if (token === '#') {
      t.step(5, `Read #. No node here, so this child is null.`, [reading('tree rebuilt so far', null), arr(tokens, { label: 'tokens', tones: tokens.map((_, i): 'dim' | 'miss' | null => (i < next - 1 ? 'dim' : i === next - 1 ? 'miss' : null)), pointers: next < tokens.length ? [{ name: 'next', at: next }] : [] })])
      return null
    }
    const node: TreeNode = { val: Number(token), left: null, right: null }
    t.step(5, `Read ${token}. Make a node, then read its left child, then its right child.`, [reading('tree rebuilt so far', node), arr(tokens, { label: 'tokens', tones: tokens.map((_, i): 'dim' | 'focus' | null => (i < next - 1 ? 'dim' : i === next - 1 ? 'focus' : null)), pointers: next < tokens.length ? [{ name: 'next', at: next }] : [] })])
    node.left = read()
    node.right = read()
    return node
  }
  return read()
}
