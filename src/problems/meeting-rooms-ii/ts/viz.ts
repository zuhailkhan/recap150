// Trace-only drawing helpers. Never shown on the page.
import { arr, intervals, type Panel, type Tone } from '../../../core/panels'

export type Phase = 'sorted' | 'look' | 'open' | 'reuse' | 'done'

/**
 * The meetings in start order with the sweep marks, the two sorted arrays with the pointers i and e, and the room count.
 * look = comparing, open = a new room (miss), reuse = an earlier room is freed (hit).
 * e has already moved on in the reuse phase, so the freed end is ends[e - 1].
 */
export function view(meetings: number[][], starts: number[], ends: number[], i: number, e: number, rooms: number, phase: Phase): Panel[] {
  const byStart = [...meetings].sort((a, b) => a[0] - b[0])
  const lo = starts.length > 0 ? Math.min(...starts) : 0
  const hi = Math.max(1, ...ends)
  const now: Tone | undefined = phase === 'open' ? 'miss' : phase === 'reuse' ? 'hit' : 'focus'
  const live = phase === 'look' || phase === 'open' || phase === 'reuse'
  const freed = ends[phase === 'reuse' ? e - 1 : e]
  const marks = live ? [{ at: starts[i], label: `s ${starts[i]}` }, { at: freed, label: `e ${freed}` }] : []
  const startTones = starts.map((_, j): Tone | undefined => (j < i ? 'dim' : j === i && live ? now : undefined))
  const endTones = ends.map((_, j): Tone | undefined => (j < e - (phase === 'reuse' ? 1 : 0) ? 'dim' : phase === 'reuse' && j === e - 1 ? 'hit' : j === e && live ? 'focus' : undefined))
  return [
    intervals(byStart.map(([start, end], j) => ({ start, end, tone: j < i ? 'dim' : j === i && live ? now : undefined })), { label: 'start order. s = the next start, e = the earliest end ahead', min: lo, max: hi, marks }),
    arr(starts, { label: 'starts, sorted', tones: startTones }),
    arr(ends, { label: 'ends, sorted', tones: endTones }),
    arr([rooms], { label: 'rooms opened', tones: [phase === 'done' ? 'hit' : 'keep'] }),
  ]
}
