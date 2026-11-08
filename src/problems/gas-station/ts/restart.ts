import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets } from '../../../core/panels'
import { gainsOf, tripTones } from './viz'

export function canCompleteCircuit(gas: number[], cost: number[], t: Tracer = noop): number {
  let total = 0 // [1] gas minus cost over the whole circle
  let tank = 0 // [1] fuel in the tank since the current start
  let start = 0 // [1] the station we are trying to start from
  t.step(1, 'Try to start at station 0 with an empty tank. total adds up every station, tank only the trip since the current start.', [arr(gainsOf(gas, cost), { label: 'gas − cost at each station' }), buckets([{ key: 'start', items: [start] }, { key: 'tank', items: [tank], tone: 'focus' }, { key: 'total', items: [total] }], { label: 'state' })])
  for (let i = 0; i < gas.length; i++) {
    const gain = gas[i] - cost[i] // [2] fuel gained here minus fuel needed for the next leg
    total += gain
    tank += gain
    t.step(2, `Station ${i}: take ${gas[i]}, pay ${cost[i]} for the leg to the next. Net ${gain >= 0 ? '+' : ''}${gain}. tank = ${tank}.`, [arr(gainsOf(gas, cost), { label: 'gas − cost at each station', tones: tripTones(gas.length, start, i, tank < 0 ? 'miss' : 'keep'), pointers: [{ name: 'start', at: start }, { name: 'i', at: i, tone: tank < 0 ? 'miss' : 'focus' }], window: [start, i] }), buckets([{ key: 'start', items: [start] }, { key: 'tank', items: [tank], tone: tank < 0 ? 'miss' : 'focus' }, { key: 'total', items: [total] }], { label: 'state' })])
    if (tank < 0) { // [3] ran dry: no station from start to i can be a good start
      t.step(3, `tank went below zero, so a start at ${start} cannot get past station ${i}. Any station between them would reach ${i} with even less fuel, because we arrived there with a tank of 0 or more. Skip them all: restart at ${i + 1}.`, [arr(gainsOf(gas, cost), { label: 'gas − cost at each station', tones: tripTones(gas.length, start, i, 'miss'), pointers: [{ name: 'start', at: start, tone: 'miss' }, { name: 'i', at: i, tone: 'miss' }], window: [start, i] }), buckets([{ key: 'start', items: [start], tone: 'miss' }, { key: 'tank', items: [tank], tone: 'miss' }, { key: 'total', items: [total] }], { label: 'state' })])
      start = i + 1
      tank = 0
    }
  }
  t.step(4, total < 0 ? `total is ${total}. There is less gas than the trip costs in all, so no start works.` : `total is ${total}, not negative. The fuel is enough overall, so the last restart, station ${start}, works. Its tank never dips below 0, and the surplus covers the part before it.`, [arr(gainsOf(gas, cost), { label: 'gas − cost at each station', tones: gas.map((_, k) => (total < 0 ? 'miss' : k < start ? 'dim' : 'hit')) }), buckets([{ key: 'start', items: [total < 0 ? -1 : start], tone: total < 0 ? 'miss' : 'hit' }, { key: 'total', items: [total] }], { label: 'answer' })])
  return total >= 0 ? start : -1 // [4] enough fuel overall: the last restart is the answer
}
