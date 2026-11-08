// Trace-only drawing helpers. Never shown on the page.
import { bits, buckets, type Panel, type Tone } from '../../../core/panels'

/** The bits of k still to use (lowest bit on the right) next to the current base and result. */
export function state(k: number, width: number, base: number, result: number, lowBit: Tone | null = null): Panel[] {
  const tones: (Tone | null)[] = Array.from({ length: width }, (_, i) => (i === width - 1 ? lowBit : null))
  return [
    bits([{ label: 'k left', value: k, tones }], { width, label: 'bits of k still to use' }),
    buckets([{ key: 'base', items: [base] }, { key: 'result', items: [result], tone: lowBit === 'hit' ? 'hit' : undefined }], { label: 'values' }),
  ]
}
