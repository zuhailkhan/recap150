// Trace-only drawing helpers. Never shown on the page.
import { buckets, type Panel, type Tone } from '../../../core/panels'

/**
 * Tones for the matrix.
 * Zeros in row 0 or column 0 are markers (keep). The row being worked on is focus.
 * Other zeros are cells already wiped (hit).
 */
export function zeroTones(m: number[][], row = -1, done = false): (Tone | null)[][] {
  return m.map((cells, i) => cells.map((v, j): Tone | null => {
    if (done) return v === 0 ? 'hit' : null
    if (v === 0 && (i === 0 || j === 0)) return 'keep'
    if (i === row) return v === 0 ? 'hit' : 'focus'
    return v === 0 ? 'hit' : null
  }))
}

/** The two "does the first row / column hold a real zero" flags. */
export function flags(firstRow: boolean, firstCol: boolean, hot?: 'row' | 'col'): Panel {
  return buckets([
    { key: 'row 0 had a zero', items: [firstRow ? 'yes' : 'no'], tone: hot === 'row' ? 'hit' : undefined },
    { key: 'column 0 had a zero', items: [firstCol ? 'yes' : 'no'], tone: hot === 'col' ? 'hit' : undefined },
  ], { label: 'flags' })
}
