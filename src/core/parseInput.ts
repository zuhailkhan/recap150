/** Custom input box: arguments as JSON separated by commas, e.g.  [2,7,11,15], 9 */
export const MAX_CUSTOM_ITEMS = 12

function size(v: unknown): number {
  if (Array.isArray(v)) return v.reduce<number>((n, x) => n + size(x), 0) || v.length
  if (typeof v === 'string') return Math.ceil(v.length / 4)
  return 1
}

export function parseArgs(text: string, arity: number): { args?: unknown[]; error?: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(`[${text}]`)
  } catch {
    return { error: 'Could not read that. Write the arguments as JSON, separated by commas.' }
  }
  const args = parsed as unknown[]
  if (args.length !== arity) return { error: `Expected ${arity} argument${arity === 1 ? '' : 's'}, got ${args.length}.` }
  if (args.some((a) => size(a) > MAX_CUSTOM_ITEMS * 2)) return { error: 'Keep it small so the trace stays readable.' }
  return { args }
}
