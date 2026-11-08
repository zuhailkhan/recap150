# System design tracks: plan

Two new tracks next to DSA. They share the app shell, the stage visuals, the stepper, the masked code blocks and the recap engine.

There is no official list I can fetch and verify (unlike the NeetCode 150), so the lists below are a **curated proposal** from general knowledge of common interview topics. Edit them freely: a topic is one folder, so adding or removing one is cheap.

## LLD: low-level design (object design, classes, patterns)

Each explainer teaches how to turn a vague brief into classes, and why those classes. Code is real TypeScript and Go with tests. A scenario stepper runs actual calls through the code and draws a sequence diagram plus the object state.

| Group | Topics |
|---|---|
| Booking and reservation | Parking Lot, Movie Ticket Booking, Hotel Reservation, Library Management |
| State machines | Vending Machine, ATM, Elevator System, Traffic Signal |
| Games | Tic-Tac-Toe, Chess, Snake and Ladder |
| Events and messaging | Notification System, Pub-Sub Message Broker, Logger Framework |
| Money and rules | Splitwise (expense sharing), Rate Limiter, Coupon and Discount Engine |
| Storage-like | In-memory File System, Key-Value Store with TTL |

**Pilots (3):** Parking Lot (Strategy, Factory), Vending Machine (State), Notification System (Observer, Strategy).

## HLD: high-level design (architecture, scale, trade-offs)

Each explainer starts from requirements and numbers, then grows the architecture one forced step at a time. No code. An estimator with live sliders turns assumptions into QPS, storage and bandwidth. Request-flow steppers show what happens on each hop.

| Group | Topics |
|---|---|
| Storage and lookup | URL Shortener, Pastebin, Distributed Key-Value Store, Distributed Cache |
| Feeds and social | News Feed, Twitter Timeline, Instagram, Typeahead (Autocomplete) |
| Messaging and real time | Chat System, Notification Service, Live Comments |
| Media and files | Video Streaming, File Sync (Dropbox), Image Hosting |
| Marketplace and location | Ride Hailing, Food Delivery, Nearby Friends or Places |
| Infrastructure | Distributed Rate Limiter, Web Crawler, Unique ID Generator, Job Scheduler |
| Transactions | Ticket Booking, Payment System, Hotel Booking |

**Pilots (3):** URL Shortener (storage, caching, ID generation), News Feed (fan-out on write vs read), Chat System (connections, ordering, delivery).

## Folder layout

```
src/design/catalog.json              the two curated lists (slug, title, group, difficulty, track)
src/design/lld/<slug>/
  meta.json                          brief, requirements, idea, class model, patterns, decisions, follow-ups
  cases.json                         scenario cases (ops driver: [ops, args] -> results), shared by TS and Go tests
  ts/<variant>.ts  (+ .driver.ts)    traced reference implementation, shown as the TypeScript
  go/<variant>.go  (+ .driver.go)    Go implementation, shown on the page
src/design/hld/<slug>/
  meta.json                          requirements, estimator, API, data model, evolution steps, flows, deep dives, failures
```

## Pages

- Sidebar gets a track switch: DSA, LLD, HLD. Each track has its own groups and progress.
- LLD page: brief and requirements, the one design idea, class diagram, run a scenario (sequence diagram and state), patterns used, decisions and alternatives, code in TypeScript and Go, follow-up questions, 30-second recap.
- HLD page: brief and requirements, estimator, API and data model, evolve the design (stepper), request flows (stepper), deep dives with trade-offs, failure modes, scaling levers, 30-second recap.

## Quality gates (added to `npm run verify`)

- Zod schemas for LLD and HLD meta.
- LLD: TypeScript scenario cases pass, Go `gofmt`/`vet`/tests generated from the same cases, same numbered stages in TypeScript and Go.
- HLD: every diagram edge and flow references a real node, every estimator expression parses and gives finite numbers at default and at slider extremes, every evolution step adds something real.
- Playwright smoke for every explainer at 360px and 1440px.

## Recap

Separate decks (`dsa`, `lld`, `hld`). Card ids are prefixed (`lld:parking-lot`), the daily mix and weak spots are per deck, and the recap home picks a deck. Built after the pilots are approved.
