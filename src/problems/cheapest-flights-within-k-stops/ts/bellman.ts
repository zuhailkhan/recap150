import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

export function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number, t: Tracer = noop): number {
  let cost = new Array<number>(n).fill(Infinity) // cheapest known price to each city
  cost[src] = 0 // [1] with zero flights we are only at the start
  t.step(1, `Start in city ${src}, which costs 0. Every other city is unreachable so far (inf). We may use up to ${k + 1} flights.`, show(n, flights, cost, cost, src, dst, 0))
  for (let round = 0; round <= k; round++) {
    const next = cost.slice() // [2] read from cost, write to next: one flight added per round
    t.step(2, `Round ${round + 1}. Copy the costs. We read the old copy and write the new one, so each city gains at most one flight this round.`, show(n, flights, cost, next, src, dst, round + 1))
    for (const [from, to, price] of flights) {
      if (cost[from] !== Infinity && cost[from] + price < next[to]) next[to] = cost[from] + price // [3] one more flight, priced from LAST round's cost
    }
    t.step(3, `Round ${round + 1} done: ${next.some((c, i) => c < cost[i]) ? 'some cities got cheaper using one more flight' : 'nothing got cheaper'}. These costs allow at most ${round + 1} flight${round ? 's' : ''}.`, show(n, flights, cost, next, src, dst, round + 1, true))
    cost = next
  }
  t.step(4, cost[dst] === Infinity ? `City ${dst} cannot be reached within ${k + 1} flights, so the answer is -1.` : `After ${k + 1} rounds the cheapest price to city ${dst} is ${cost[dst]}.`, show(n, flights, cost, cost, src, dst, k + 1, false, true))
  return cost[dst] === Infinity ? -1 : cost[dst] // [4] unreachable within the limit
}
