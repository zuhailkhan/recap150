import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, stack as stackPanel } from '../../../core/panels'

export function carFleet(target: number, position: number[], speed: number[], t: Tracer = noop): number {
  const cars = position
    .map((pos, i) => ({ pos, time: (target - pos) / speed[i] })) // [1] hours each car needs if nothing blocks it
    .sort((a, b) => b.pos - a.pos) // [1] closest to the target first
  const pos = cars.map((c) => c.pos)
  const hours = cars.map((c) => +c.time.toFixed(2))
  t.step(1, `Target is ${target}. Sort the cars closest-first and compute the hours each needs if the road were empty.`, [arr(pos, { label: 'position (closest first)' }), arr(hours, { label: 'hours to target' })])
  const fleets: number[] = [] // [2] arrival time of each fleet, nearest fleet at the bottom
  t.step(2, 'The stack will hold one arrival time per fleet. Only the top matters: it is the fleet right ahead of the next car.', [arr(pos, { label: 'position (closest first)' }), arr(hours, { label: 'hours to target' }), stackPanel([], { label: 'fleets (arrival hours)', empty: 'empty' })])
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i]
    if (fleets.length === 0 || car.time > fleets[fleets.length - 1]) { // [3] slower than the fleet ahead: it can never catch up
      fleets.push(car.time)
      t.step(3, fleets.length === 1 ? `The car at ${car.pos} is closest, so nothing is ahead of it. It starts the first fleet (${hours[i]} h).` : `The car at ${car.pos} needs ${hours[i]} h, longer than the ${+fleets[fleets.length - 2].toFixed(2)} h of the fleet ahead. It never catches up. New fleet.`, [arr(pos, { label: 'position (closest first)', tones: pos.map((_, k) => (k === i ? 'hit' : k < i ? 'dim' : null)), pointers: [{ name: 'car', at: i }] }), arr(hours, { label: 'hours to target', tones: hours.map((_, k) => (k === i ? 'hit' : k < i ? 'dim' : null)) }), stackPanel(fleets.map((f) => +f.toFixed(2)), { label: 'fleets (arrival hours)', tones: fleets.map((_, k) => (k === fleets.length - 1 ? 'hit' : null)) })])
      continue
    }
    // [4] otherwise it reaches the fleet ahead before the target and slows to its pace
    t.step(4, `The car at ${car.pos} needs only ${hours[i]} h, less than the ${+fleets[fleets.length - 1].toFixed(2)} h of the fleet ahead. It catches up and slows down. Same fleet, nothing pushed.`, [arr(pos, { label: 'position (closest first)', tones: pos.map((_, k) => (k === i ? 'miss' : k < i ? 'dim' : null)), pointers: [{ name: 'car', at: i, tone: 'miss' }] }), arr(hours, { label: 'hours to target', tones: hours.map((_, k) => (k === i ? 'miss' : k < i ? 'dim' : null)) }), stackPanel(fleets.map((f) => +f.toFixed(2)), { label: 'fleets (arrival hours)', tones: fleets.map(() => 'keep' as const) })])
  }
  t.step(5, `All cars are placed. ${fleets.length} fleet${fleets.length === 1 ? '' : 's'} arrive.`, [arr(pos, { label: 'position (closest first)', tones: pos.map(() => 'dim' as const) }), stackPanel(fleets.map((f) => +f.toFixed(2)), { label: 'fleets (arrival hours)', tones: fleets.map(() => 'hit' as const) })])
  return fleets.length // [5] one stack entry per fleet
}
