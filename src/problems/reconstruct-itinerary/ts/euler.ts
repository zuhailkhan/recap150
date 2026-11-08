import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

export function findItinerary(tickets: string[][], t: Tracer = noop): string[] {
  const next = new Map<string, string[]>()
  for (const [from, to] of tickets) {
    if (!next.has(from)) next.set(from, [])
    next.get(from)!.push(to)
  }
  // [1] smallest destination goes LAST, so pop() hands it out in O(1)
  for (const dests of next.values()) dests.sort().reverse()
  const path = ['JFK']
  const route: string[] = []
  t.step(1, 'Sort every airport\'s destinations. We will always try the smallest unused ticket first. Start the walk at JFK.', show(tickets, next, path, route))
  while (path.length > 0) {
    const here = path[path.length - 1]
    const dests = next.get(here)
    if (dests && dests.length > 0) {
      path.push(dests.pop()!) // [2] fly the smallest unused ticket
      t.step(2, `At ${here}, fly the smallest unused ticket, to ${path[path.length - 1]}. That ticket is now used up.`, show(tickets, next, path, route, true))
    } else {
      route.push(path.pop()!) // [3] stuck: this airport goes at the END of what is left
      t.step(3, `${route[route.length - 1]} has no unused tickets. Add it to the route and step back.`, show(tickets, next, path, route))
    }
  }
  route.reverse() // [4] we filled the route from the back
  t.step(4, 'We added airports from the back of the trip to the front. Reverse the list to read it in order.', show(tickets, next, path, route, false, true))
  return route
}
