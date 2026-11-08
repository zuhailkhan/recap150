// How a solution's output is compared with the expected value.
// Shared by the TypeScript runner; the generated Go tests implement the same modes.
export type CompareMode = 'exact' | 'sortedFlat' | 'sortedGroups' | 'approx'

const keyOf = (v: unknown) => JSON.stringify(v)
const cmp = (a: unknown, b: unknown) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b)))

/** sortedFlat: sort a flat list. sortedGroups: sort inside every inner list, then sort the inner lists (works for strings and numbers). */
export function normalize(v: unknown, mode: CompareMode): unknown {
  if (mode === "sortedFlat") return [...(v as unknown[])].sort(cmp)
  if (mode === "sortedGroups") return (v as unknown[][]).map((g) => [...g].sort(cmp)).sort((a, b) => keyOf(a).localeCompare(keyOf(b)))
  return v
}

export function same(got: unknown, expected: unknown, mode: CompareMode): boolean {
  if (mode === "approx") return typeof got === "number" && typeof expected === "number" && Math.abs(got - expected) <= 1e-5 * Math.max(1, Math.abs(expected))
  return keyOf(normalize(got, mode)) === keyOf(normalize(expected, mode))
}
