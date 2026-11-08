# Authoring a system design explainer (LLD and HLD)

Read `docs/SYSTEM_DESIGN.md` for the plan and `docs/AUTHORING.md` for the shared rules (own words, short plain sentences, tones, tracer, drivers, Go rules). This file covers what is different.

The reader is a senior TypeScript and Go engineer who finds things hard to **see**. Make the structure visible. The two finished references are the style and structure to copy:

- LLD: `src/design/lld/parking-lot/`
- HLD: `src/design/hld/url-shortener/`

Catalog entries (title, group, difficulty) live in `src/design/catalog.json`. Your slug, title, group and difficulty must match the entry exactly. Do not edit the catalog.

## Rules for both tracks

- Own words. No pasted or closely paraphrased text from books, courses or articles. Facts and ideas are fine, wording is yours.
- No invented statistics presented as fact. Use round, clearly labelled assumptions ("assume 10M new links per day").
- Short sentences. Explain jargon in one line. No filler, no marketing words.
- Where something is a judgement call, say what the trade-off is and what you pick, and why.
- No runtime network calls, no new dependencies, no placeholder text.

## LLD: `src/design/lld/<slug>/`

```
meta.json                 validated by lldSchema in src/core/designSchema.ts
cases.json                scenario cases: input [ops, args], expected [results], shared by TypeScript and Go
ts/<variant>.ts           the real design. Shown on the page as the TypeScript. No tracer lines in it
ts/<variant>.driver.ts    replays ops against it and emits the trace. Never shown
go/<variant>.go           same design in Go, package lld_<slug_with_underscores>
go/<variant>.driver.go    replays ops (func runOps(ops []string, args [][]any) []any). Never shown
Demo.vue                  OPTIONAL small interactive widget, shown under the class diagram
```

How it works (see parking-lot):

- The shown code is the design itself: interfaces, classes, the real logic. Keep it idiomatic, compact and readable. No driver code in it.
- `[n]` stage markers sit in comments on the lines where each stage happens, in both TypeScript and Go, exactly as for DSA. 2 to 6 stages, the same numbers in both languages. No pseudocode for LLD.
- The **driver** builds the object graph, replays the operations, and calls `t.step(stage, sentence, panels)`. To draw real calls, wrap collaborators in small spies (see `strategySpy` in parking-lot) that record messages. That way the sequence diagram shows what actually happened.
- Panels available: `seq(actors, messages)` for sequence diagrams, `classes(...)` for class diagrams, plus `arr`, `buckets`, `stack`, `list`, `grid`, `tree`, `graph`, `dp` for state. A good scenario step shows two things: the calls that just happened (`seq`) and the state they changed (`arr`, `buckets`, `grid`, or similar). Clear the call log at the start of each operation so each diagram stays small.
- Each preset trace is 3 to 24 steps, the first preset reaches every stage. Presets are real scenarios that teach something (two strategies on the same input, a rejection, a state change).
- `cases.json`: at least 8 cases, at least 3 marked `"edge": true`. Cover happy paths, rejections, boundaries, state after several operations, and the case that distinguishes the design from a naive one. Compute expected values by reasoning independently or with a separate script kept outside the repo, not by running your own solution.
- `meta.json` fields: `brief`, `requirements.functional` (3 to 8) and `outOfScope`, `idea.sentence` (one sentence about the design insight), `model` (classes with grid positions `x` and `y`, and relations), `patterns` (named patterns and where they appear), `decisions` (2 to 4, each with the road not taken), `followups` (3 to 5 interview follow-ups with answers, including concurrency where it applies), `watch.presets`, `variants` (usually one) with `stages`, `goArgs`, `goRet`, `compare`, `gotchas` (at least 2, real TypeScript and Go traps), `recap`.
- Class diagram: 4 to 9 classes, positions on a small grid (`x` column, `y` row), no overlapping boxes. Use `interface` and `enum` kinds. Relation kinds: `inherits`, `implements`, `has` (owns), `uses`, `creates`. Keep the diagram faithful to the code you wrote.
- Prefer composition and small interfaces. Show the design pattern only where it earns its place, and say what the pattern buys.
- Concurrency: if the real system would be hit by two callers at once, say so in a follow-up or gotcha and show where the lock goes. Do not pretend the single-threaded code is thread safe.

Verify and look:

```
npx tsx scripts/verify.ts --track=lld --only=<slug>
node scripts/smoke-dev.mjs  # DSA only; for design pages use the commands below
node scripts/look.mjs <name>,/lld/<slug>,1440,900,light,click,#watch   # writes screenshots/look-<name>.png
node scripts/look.mjs <name>,/lld/<slug>,390,844,light,click,#watch
npx vue-tsc --noEmit
```

Look at the crops (`#model`, `#watch`, top of page) at desktop and phone width. The class diagram must not have crossing lines through boxes, and the sequence diagram must read top to bottom.

## HLD: `src/design/hld/<slug>/meta.json`

HLD is data only: no code, no tests. The page is generated from `meta.json`, validated by `hldSchema`, and checked by `npx tsx scripts/verify-hld.ts --only=<slug>`.

Sections the schema requires, and what each should do:

- `brief`, `requirements` (functional, non-functional with numeric targets, out of scope).
- `estimate`: 2 to 6 slider inputs and 2 to 7 outputs computed with a tiny arithmetic language (`+ - * / ^ ( )`, numbers, earlier ids, and `ceil floor round sqrt log2 log10 min max abs`). Outputs can use earlier outputs. Every output must be finite and non-negative at the defaults, at all-minimum and at all-maximum (verify checks). Use `"log": true` for inputs that span orders of magnitude. Put units in `unit`. Aim for the numbers that actually drive the design: requests per second, storage, bandwidth, number of servers, cache size.
- `api` (2 to 7 calls) and `data` (entities, fields, store, why that store).
- `nodes` and `edges`: the **finished** architecture, with `since` (the evolution step index at which each appears) and optionally `until` on an edge (it disappears at that step). Positions `x`, `y` are 0 to 100 across the canvas. Nodes are about 17 percent wide and 14 percent tall, so keep centres at least 18 apart horizontally or 15 apart vertically. Verify rejects overlapping nodes and edges drawn through a node, at every step. Node kinds: `client`, `lb`, `service`, `cache`, `db`, `queue`, `blob`, `cdn`, `worker`, `external`. Keep to about 10 to 14 nodes. Use short labels (24 characters) and an optional `sub` (28).
- `evolution`: 3 to 7 steps that grow the design from the simplest thing that works. Each step has `title`, `problem` (the number or failure that forces it) and `change`. Every step must add at least one node or edge. This is the heart of the page: the reader should see why each part exists.
- `flows`: 1 to 4 request paths over the finished design (for example write path and read path). Each step names the `nodes` and `edges` to highlight and says in one sentence what happens on that hop. Edges must exist in the finished design.
- `deepDives`: 2 to 4 real trade-offs where an interviewer will push. Each has 2 to 3 options with `pros` and `cons`, a `pick`, and a `because`.
- `failures` (3 to 5: what breaks, impact, fix), `scaling` (2 to 4 limits and levers), `recap` (one-sentence key, the key numbers, 3 to 4 moves).
- Use real engineering vocabulary (consistent hashing, fan-out on write, write-ahead log, idempotency key, back-pressure) and explain each in plain words the first time.

Verify and look:

```
npx tsx scripts/verify-hld.ts --only=<slug>
node scripts/look.mjs <name>,/hld/<slug>,1440,900,light,click,#evolve
node scripts/look.mjs <name>,/hld/<slug>,1440,900,light,click,#flows
node scripts/look.mjs <name>,/hld/<slug>,1440,900,light,top,#numbers
node scripts/look.mjs <name>,/hld/<slug>,390,844,light,click,#evolve
npx vue-tsc --noEmit
```

Open the crops. Step through every evolution step in the browser (or take crops at several steps): the newest part must be the amber one, nothing may overlap, labels must be readable, and the estimator numbers must make sense when you move each slider.

## What you may edit

Only files inside your own `src/design/lld/<slug>/` or `src/design/hld/<slug>/` folders. Do not edit shared code, the catalog, docs, scripts or `package.json`. If you need a shared change, say what and why in your report and use the closest existing option. Do not run git, `npm run verify`, `npm run build`, `npm run preview` or `npx playwright test`.

## Final report

Per topic: ready or draft, what the main idea and the evolution (HLD) or patterns (LLD) are, which screenshots you actually opened, and anything surprising. Keep it short.
