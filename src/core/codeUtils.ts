// Helpers for the three code listings. Stage badges look like  [1]  inside a comment.

/** Stage numbers marked in comments, e.g. `// [2] build key` or `# [2] build key`. */
export function stagesIn(code: string): number[] {
  const found = new Set<number>()
  for (const line of code.split('\n')) {
    const at = findComment(line)
    if (at < 0) continue
    for (const m of line.slice(at).matchAll(/(?<![\w\])])\[([1-9]\d*)\]/g)) found.add(Number(m[1])) // a standalone [n], not dp[2] or a[0]
  }
  return [...found].sort((a, b) => a - b)
}

function findComment(line: string): number {
  let quote = ''
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = ''
    } else if ((c === '"' || c === "'" || c === '`') && line.indexOf(c, i + 1) > -1) quote = c // an apostrophe with no partner (don't) is just text
    else if (c === '#' || (c === '/' && line[i + 1] === '/')) return i
  }
  return -1
}

const TRACE_LINE = /^\s*t\.step\(.*\);?\s*$/

/** Lines that mention the tracer but are not a complete one-line t.step(...) call. */
export function badTraceLines(src: string): string[] {
  return src.split('\n').filter((l) => /\bt\.step\b/.test(l) && !TRACE_LINE.test(l))
}

/** Turn a traced reference solution into the clean code shown on the page. */
export function stripTraceCode(src: string): string {
  return src
    .split('\n')
    .filter((l) => !TRACE_LINE.test(l) && !/^\s*import\s/.test(l))
    .join('\n')
    .replace(/,\s*t:\s*Tracer\s*=\s*noop/g, '')
    .replace(/\(\s*t:\s*Tracer\s*=\s*noop\s*\)/g, '()') // method whose only parameter is the tracer
    .replace(/\(\s*t\s*\)/g, '()') // tracer is the only argument: walk(t)
    .replace(/,\s*t(?=\s*\))/g, '') // tracer forwarded into a helper call, e.g. walk(node, t)
    .replace(/^export\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n'
}

/** Drop the `package x` line from Go source for display. */
export function stripGoPackage(src: string): string {
  return src.replace(/^package\s+\w+\s*\n+/, '').trim() + '\n'
}
