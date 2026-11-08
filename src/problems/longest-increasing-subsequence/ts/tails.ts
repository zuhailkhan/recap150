export function lengthOfLISTails(nums: number[]): number {
  const tails: number[] = [] // [1] tails[k] = smallest last number of any increasing run of length k + 1
  for (const x of nums) {
    let lo = 0
    let hi = tails.length
    while (lo < hi) { // [2] binary search for the first tail that is >= x
      const mid = (lo + hi) >> 1
      if (tails[mid] < x) lo = mid + 1
      else hi = mid
    }
    if (lo === tails.length) tails.push(x) // [3] x beats every tail: the longest run grows by one
    else tails[lo] = x // [3] otherwise x is a smaller tail for runs of that length
  }
  return tails.length // [4] the longest run's length
}
