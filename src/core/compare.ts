// How a solution's output is compared with the expected value.
// Shared by the TypeScript runner; the generated Go tests implement the same modes.
export type CompareMode = 'exact' | 'sortedFlat' | 'sortedGroups'

const keyOf = (v: unknown) => JSON.stringify(v)

export function normalize(v: unknown, mode: CompareMode): unknown {
  if (mode === 'sortedFlat') return [...(v as number[])].sort((a, b) => a - b)
  if (mode === 'sortedGroups') {
    return (v as string[][]).map((g) => [...g].sort()).sort((a, b) => keyOf(a).localeCompare(keyOf(b)))
  }
  return v
}

export function same(got: unknown, expected: unknown, mode: CompareMode): boolean {
  return keyOf(normalize(got, mode)) === keyOf(normalize(expected, mode))
}
