// Trace-only helper. Not shown on the page.
import { buckets, type BucketsPanel, type Tone } from '../../../core/panels'

/** The count map as buckets in sorted card order. Cards with no copies left are dim. hot cards use the given tone. */
export function deck(count: Map<number, number>, hot: number[] = [], tone: Tone = 'focus'): BucketsPanel {
  const keys = [...count.keys()].sort((a, b) => a - b)
  return buckets(keys.map((k) => ({ key: String(k), items: [count.get(k) ?? 0], tone: hot.includes(k) ? tone : count.get(k) === 0 ? ('dim' as const) : undefined })), { label: 'copies left of each card', keyLabel: 'card' })
}
