export class MinStack {
  vals: number[] = [] // [1] the normal stack of values
  mins: number[] = [] // [1] mins[i] is the smallest value in vals[0..i]

  push(val: number): void {
    const low = this.mins.length ? this.mins[this.mins.length - 1] : val
    this.vals.push(val) // [2] store the value
    this.mins.push(Math.min(val, low)) // [2] and the smallest value so far
  }

  pop(): void {
    this.vals.pop() // [3] both stacks shrink together
    this.mins.pop()
  }

  top(): number {
    return this.vals[this.vals.length - 1] // [4] newest value
  }

  getMin(): number {
    return this.mins[this.mins.length - 1] // [5] the answer is already stored on top
  }
}
