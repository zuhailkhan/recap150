// Tiny syntax highlighter for the three listings. Output is escaped HTML.
export type Lang = 'pseudo' | 'ts' | 'go'

const KEYWORDS: Record<Lang, string> = {
  ts: 'const let function return if else for of in new continue break while true false null undefined type as void',
  go: 'func return if else for range var const map make append len package import nil true false continue break',
  pseudo: 'function return if else for each in from to is not and or empty continue while',
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const badges = (s: string) => s.replace(/\[(\d+)\]/g, '<span class="badge sm">$1</span>')

export function highlight(code: string, lang: Lang): string {
  const kw = KEYWORDS[lang].split(' ').join('|')
  const comment = lang === 'pseudo' ? '#.*' : '\\/\\/.*'
  const re = new RegExp(`(${comment})|("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)|\\b(${kw})\\b|\\b(\\d+)\\b`, 'g')
  return code
    .split('\n')
    .map((line) => {
      let out = ''
      let last = 0
      for (const m of line.matchAll(re)) {
        out += esc(line.slice(last, m.index))
        if (m[1] !== undefined) out += `<span class="tk-c">${badges(esc(m[1]))}</span>`
        else if (m[2] !== undefined) out += `<span class="tk-s">${esc(m[2])}</span>`
        else if (m[3] !== undefined) out += `<span class="tk-k">${esc(m[3])}</span>`
        else out += `<span class="tk-n">${esc(m[4])}</span>`
        last = m.index! + m[0].length
      }
      return out + esc(line.slice(last))
    })
    .join('\n')
}
