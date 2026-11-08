import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, grid } from '../../../core/panels'

export function exist(board: string[][], word: string, t: Tracer = noop): boolean {
  const rows = board.length
  const cols = board[0].length

  function dfs(r: number, c: number, k: number): boolean {
    if (k === word.length) { // [2] every letter is matched: the word is on the board
      t.step(2, `All ${word.length} letters matched along one path. The word is on the board.`, [grid(board, { label: 'board (# = cell in use)', tones: board.map((row) => row.map((v) => (v === '#' ? 'hit' : null))) }), arr(word.split(''), { label: 'word', tones: word.split('').map(() => 'hit') })])
      return true
    }
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[k]) { // [2] off the board, in use, or the wrong letter: dead end
      t.step(2, r < 0 || c < 0 || r >= rows || c >= cols ? `(${r},${c}) is off the board. Dead end.` : board[r][c] === '#' ? `(${r},${c}) is already in use on this path. Dead end.` : `(${r},${c}) holds "${board[r][c]}" but the word needs "${word[k]}". Dead end.`, [grid(board, { label: 'board (# = cell in use)', tones: board.map((row, i) => row.map((v, j) => (i === r && j === c ? 'miss' : v === '#' ? 'keep' : null))) }), arr(word.split(''), { label: 'word', tones: word.split('').map((_, j) => (j < k ? 'keep' : j === k ? 'miss' : null)) })])
      return false
    }
    const saved = board[r][c]
    board[r][c] = '#' // [3] mark this cell as in use, so the path cannot step on it again
    t.step(3, `"${saved}" at (${r},${c}) matches letter ${k + 1}. Mark it with # and look right, down, left, up for "${word[k + 1] ?? 'the end'}".`, [grid(board, { label: 'board (# = cell in use)', tones: board.map((row, i) => row.map((v, j) => (i === r && j === c ? 'focus' : v === '#' ? 'keep' : null))) }), arr(word.split(''), { label: 'word', tones: word.split('').map((_, j) => (j < k ? 'keep' : j === k ? 'focus' : null)) })])
    const found = dfs(r, c + 1, k + 1) || dfs(r + 1, c, k + 1) || dfs(r, c - 1, k + 1) || dfs(r - 1, c, k + 1) // [3] try the four neighbours, stop at the first success
    board[r][c] = saved // [4] restore the letter so other paths can use this cell
    t.step(4, `Put "${saved}" back at (${r},${c}). Other paths may use this cell again.`, [grid(board, { label: 'board (# = cell in use)', tones: board.map((row, i) => row.map((v, j) => (i === r && j === c ? 'dim' : v === '#' ? 'keep' : null))) }), arr(word.split(''), { label: 'word', tones: word.split('').map((_, j) => (j < k ? 'keep' : null)) })])
    return found
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      t.step(1, `Try starting the word at (${r},${c}).`, [grid(board, { label: 'board', tones: board.map((row, i) => row.map((_, j) => (i === r && j === c ? 'focus' : null))) }), arr(word.split(''), { label: 'word' })])
      if (dfs(r, c, 0)) return true // [1] a start cell worked
    }
  }
  t.step(1, 'No start cell led to the whole word. It is not on the board.', [grid(board, { label: 'board', tones: board.map((row) => row.map(() => 'miss')) }), arr(word.split(''), { label: 'word', tones: word.split('').map(() => 'miss') })])
  return false
}
