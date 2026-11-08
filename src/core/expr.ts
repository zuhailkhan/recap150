// A tiny, safe arithmetic evaluator for the HLD estimators.
// Numbers, + - * / ^, parentheses, variables, and a few functions. No eval, no property access.
type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string }

const FUNCS: Record<string, (...a: number[]) => number> = {
  ceil: Math.ceil, floor: Math.floor, round: Math.round, sqrt: Math.sqrt, log2: Math.log2, log10: Math.log10,
  min: Math.min, max: Math.max, abs: Math.abs,
}

function lex(src: string): Tok[] {
  const out: Tok[] = []
  const re = /\s*(?:(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|([-+*/^(),]))/gy
  let pos = 0
  while (pos < src.length) {
    re.lastIndex = pos
    const m = re.exec(src)
    if (!m) { if (src.slice(pos).trim() === '') break; throw new Error(`Unexpected "${src.slice(pos).trim()[0]}" in "${src}"`) }
    pos = re.lastIndex
    if (m[1] !== undefined) out.push({ t: 'num', v: Number(m[1]) })
    else if (m[2] !== undefined) out.push({ t: 'id', v: m[2] })
    else out.push({ t: 'op', v: m[3] })
  }
  return out
}

export function evalExpr(src: string, vars: Record<string, number>): number {
  const toks = lex(src)
  let i = 0
  const peek = () => toks[i]
  const eat = (v?: string) => { const t = toks[i++]; if (v && (!t || t.t !== 'op' || t.v !== v)) throw new Error(`Expected "${v}" in "${src}"`); return t }

  function expr(): number {
    let v = term()
    while (peek()?.t === 'op' && (peek()!.v === '+' || peek()!.v === '-')) { const op = (eat() as { v: string }).v; const r = term(); v = op === '+' ? v + r : v - r }
    return v
  }
  function term(): number {
    let v = power()
    while (peek()?.t === 'op' && (peek()!.v === '*' || peek()!.v === '/')) { const op = (eat() as { v: string }).v; const r = power(); v = op === '*' ? v * r : v / r }
    return v
  }
  function power(): number {
    const base = unary()
    if (peek()?.t === 'op' && peek()!.v === '^') { eat(); return base ** power() }
    return base
  }
  function unary(): number {
    if (peek()?.t === 'op' && peek()!.v === '-') { eat(); return -unary() }
    return primary()
  }
  function primary(): number {
    const t = eat()
    if (!t) throw new Error(`Unexpected end of "${src}"`)
    if (t.t === 'num') return t.v
    if (t.t === 'op' && t.v === '(') { const v = expr(); eat(')'); return v }
    if (t.t === 'id') {
      if (peek()?.t === 'op' && peek()!.v === '(') {
        const fn = Object.hasOwn(FUNCS, t.v) ? FUNCS[t.v] : undefined
        if (!fn) throw new Error(`Unknown function "${t.v}" in "${src}"`)
        eat('(')
        const args: number[] = []
        if (!(peek()?.t === 'op' && peek()!.v === ')')) { args.push(expr()); while (peek()?.t === 'op' && peek()!.v === ',') { eat(); args.push(expr()) } }
        eat(')')
        return fn(...args)
      }
      if (!Object.hasOwn(vars, t.v)) throw new Error(`Unknown variable "${t.v}" in "${src}"`)
      return vars[t.v]
    }
    throw new Error(`Unexpected "${t.v}" in "${src}"`)
  }

  const v = expr()
  if (i < toks.length) throw new Error(`Unexpected "${(toks[i] as { v: string | number }).v}" in "${src}"`)
  return v
}

/** Human-friendly number: 12,400,000 -> "12.4M". Small numbers keep up to 3 significant digits. */
export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '∞'
  const a = Math.abs(n)
  const units: [number, string][] = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
  for (const [d, s] of units) if (a >= d) return `${trim(n / d)}${s}`
  return trim(n)
}
const trim = (n: number) => { const a = Math.abs(n); const d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3; return String(Number(n.toFixed(d))) }
