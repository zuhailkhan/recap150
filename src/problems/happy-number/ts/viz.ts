// Trace-only drawing helpers. Never shown on the page.
import { arr, type Panel } from '../../../core/panels'

/** "19: 1² + 9² = 82" */
export const sumText = (n: number): string => {
  const ds = String(n).split('')
  return `${ds.map((d) => `${d}²`).join(' + ')} = ${ds.reduce((s, d) => s + Number(d) ** 2, 0)}`
}

/** The chain of numbers so far. The newest is in focus, older ones are kept. */
export function chain(seen: Set<number>, n: number, tone: 'focus' | 'hit' | 'miss' = 'focus'): Panel {
  const items = [...seen, n]
  return arr(items, { label: 'seen set, in the order added. Last = the number now', tones: items.map((_, i) => (i === items.length - 1 ? tone : 'keep')) })
}

/** The most recently added number. */
export const last = (s: Set<number>): number => [...s].pop() as number
