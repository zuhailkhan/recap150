export function trapPrefix(height: number[]): number {
  const n = height.length
  const left: number[] = new Array(n) // [1] left[i] = tallest bar from the start up to i
  for (let i = 0; i < n; i++) left[i] = Math.max(i > 0 ? left[i - 1] : 0, height[i])
  const right: number[] = new Array(n) // [2] right[i] = tallest bar from i to the end
  for (let i = n - 1; i >= 0; i--) right[i] = Math.max(i < n - 1 ? right[i + 1] : 0, height[i])
  let water = 0
  for (let i = 0; i < n; i++) water += Math.min(left[i], right[i]) - height[i] // [3] the lower of the two walls is the water level
  return water // [4] total over all bars
}
