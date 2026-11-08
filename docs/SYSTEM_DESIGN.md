# System design tracks: plan

Two new tracks next to DSA. They share the app shell, the stage visuals, the stepper, the masked code blocks and the recap engine.

There is no official list I can fetch and verify (unlike the NeetCode 150), so the lists below are a **curated proposal** from general knowledge of common interview topics. Edit them freely: a topic is one folder, so adding or removing one is cheap.

## LLD: low-level design (object design, classes, patterns)

Each explainer teaches how to turn a vague brief into classes, and why those classes. Code is real TypeScript and Go with tests. A scenario stepper runs actual calls through the code and draws a sequence diagram plus the object state.

| Group | Topics |
|---|---|
| Big products | Cab Booking (Uber), Food Ordering (Zomato), Online Shopping (Amazon), Movie Booking (BookMyShow), Social Feed (Instagram), Music Player (Spotify) |
| Booking and reservation | Parking Lot, Hotel Reservation, Library Management |
| State machines | Vending Machine, ATM, Elevator System, Traffic Signal |
| Games | Tic-Tac-Toe, Chess, Snake and Ladder |
| Events and messaging | Notification System, Pub-Sub Message Broker, Logger Framework |
| Money and rules | Splitwise, Rate Limiter, Coupon and Discount Engine |
| Storage-like | In-Memory File System, Key-Value Store with TTL |

**Built (pilots):** Parking Lot, Vending Machine, Notification System.

## HLD: high-level design (architecture, scale, trade-offs)

Each explainer starts from requirements and numbers, then grows the architecture one forced step at a time. No code. An estimator with live sliders turns assumptions into QPS, storage and bandwidth. Request-flow steppers show what happens on each hop.

The topics are real products, because that is what people are asked and what they want to learn. The reusable pieces those products are built from sit in "Building blocks" and are referred to from the product pages.

| Group | Topics |
|---|---|
| Ride, food and marketplaces | Uber, Zomato, Amazon, Airbnb, BookMyShow |
| Social and messaging | Instagram, WhatsApp, Twitter / X, LinkedIn, TikTok, Tinder, Slack |
| Media and streaming | Netflix, YouTube, Spotify, Hotstar (live streaming), Zoom |
| Productivity, maps and payments | Google Maps, Google Docs, Dropbox, UPI Payments (PhonePe), Google Search |
| Building blocks | URL Shortener, News Feed, Pastebin, Distributed Cache, Distributed Key-Value Store, Distributed Rate Limiter, Unique ID Generator, Notification Service, Typeahead, Nearby Places, Web Crawler, Job Scheduler |

**Built (pilots):** URL Shortener, News Feed, WhatsApp (Chat System).

## About product designs

A product page is "a system like Uber", designed from public, general knowledge and common architecture. It is **not** a claim about how the company really builds it, and it never presents invented internals, numbers or incidents as fact. Every number is a labelled assumption. Each product page must lead with what is **distinctive** about that product (for example the live location index for Uber, the three-sided marketplace for Zomato, the media pipeline for Instagram) and point to the building blocks it reuses instead of re-teaching them.

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
