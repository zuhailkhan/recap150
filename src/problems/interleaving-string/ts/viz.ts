// Trace-only helpers. Not shown on the page.
import { arr, dp, mark2, type Tone } from '../../../core/panels'

const tf = (b: boolean) => (b ? 'true' : 'false')

/** The table up to (i, j) in fill order, plus the s3 letters with the one being explained marked. */
export function view(table: boolean[][], s1: string, s2: string, s3: string, i: number, j: number, set: [number, number, Tone][] = [], blankAll = false) {
  const cells = table.map((row, r) => row.map((v, c) => (blankAll || r > i || (r === i && c > j) ? '' : v ? 'T' : 'F')))
  const at = i + j - 1
  return [
    dp(cells, {
      label: 'dp[i][j] = can the first i letters of s1 (rows) and the first j letters of s2 (columns) be woven into the first i+j letters of s3? T = yes, F = no',
      rowLabels: ['', ...s1],
      colLabels: ['', ...s2],
      tones: mark2(table.length, table[0].length, set),
    }),
    arr([...s3], { label: 's3', tones: [...s3].map((_, k) => (blankAll || at < 0 ? null : k < at ? 'dim' : k === at ? 'focus' : null)) }),
  ]
}

/** Words for the two routes into cell (i, j). Call after dp[i][j] is set. */
export function why(table: boolean[][], s1: string, s2: string, s3: string, i: number, j: number): string {
  const c = s3[i + j - 1]
  const via1 = i > 0 ? `above is ${tf(table[i - 1][j])} and s1 gives "${s1[i - 1]}" ${s1[i - 1] === c ? '=' : '≠'} "${c}"` : 'no s1 letter used yet'
  const via2 = j > 0 ? `left is ${tf(table[i][j - 1])} and s2 gives "${s2[j - 1]}" ${s2[j - 1] === c ? '=' : '≠'} "${c}"` : 'no s2 letter used yet'
  return `Last letter of s3's prefix: "${c}". Take it from s1? ${via1}. Take it from s2? ${via2}. So dp[${i}][${j}] = ${tf(table[i][j])}.`
}

/** Cells a cell reads (above and left, when they exist), plus the cell itself in focus. */
export function reads(i: number, j: number): [number, number, Tone][] {
  const out: [number, number, Tone][] = []
  if (i > 0) out.push([i - 1, j, 'keep'])
  if (j > 0) out.push([i, j - 1, 'keep'])
  out.push([i, j, 'focus'])
  return out
}
