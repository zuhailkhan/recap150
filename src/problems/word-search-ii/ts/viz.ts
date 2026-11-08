// Trace-only drawing helpers. Never shown on the page.
import { grid, trie, type Panel, type Tone } from '../../../core/panels'

/** The board (path cells, current cell, found letters) beside the trie of all words with the path as highlight. */
export function show(board: string[][], words: string[], at: [number, number][], path: string, tone: Tone, seen?: boolean[][], found: string[] = []): Panel[] {
  const tones = board.map((row, r) =>
    row.map((_, c): Tone | null => {
      if (at.some(([ar, ac]) => ar === r && ac === c)) return tone
      return seen?.[r]?.[c] ? 'keep' : null
    }),
  )
  return [
    grid(board, { label: `board. Path so far: "${path}"${found.length ? `. Found: ${found.join(', ')}` : ''}`, tones }),
    trie(words.slice(0, 20), { label: 'trie of the word list', hot: path, hotTone: tone === 'dim' ? 'keep' : tone }),
  ]
}
