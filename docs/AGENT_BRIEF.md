# Brief for problem-authoring agents

You are authoring problem explainers for **Recap150**, a Vue 3 + TypeScript app that teaches the NeetCode 150 problems visually. Repo: `C:\Users\zuhai\workspace\recap150` (Windows; the Bash tool with Unix syntax works, and so does PowerShell). The user is a senior TypeScript/Go engineer who finds algorithms hard to *picture*, so every explainer must make the core idea easy to **see**.

## Read first (in full)

1. `docs/AUTHORING.md`. This is the contract: folder layout, stages, the tracer, drivers, cases, `meta.json`, demos, checks, what you may edit, and a "Lessons" section. Follow it exactly.
2. The finished reference problems: `src/problems/two-sum`, `valid-parentheses`, `group-anagrams` (two variants), `reverse-linked-list` (driver + custom `Demo.vue`), and for harder shapes a few more: `lru-cache` (design problem with an ops driver and a doubly linked list), `valid-sudoku` (grid + buckets), `merge-k-sorted-lists` (heap), `median-of-two-sorted-arrays`. Skim at least the `meta.json`, `ts/*.ts`, the driver files and `Demo.vue` of a couple of them.
3. `src/core/schema.ts` and `src/core/panels.ts` (panel kinds and helpers). `src/visuals/` has the components. `src/views/LabView.vue` shows each panel kind in use.

## Standard

- Own words everywhere. Never paste or closely paraphrase LeetCode/NeetCode text.
- Plain, short sentences. Explain jargon in one line.
- One idea per problem. The visuals must show that idea. Choose panels that make the structure visible (tree for trees, grid for grids, graph for graphs, and so on), with consistent tones: focus = looking at now, keep = remembered, hit = answer/match, miss = rejected/mismatch, dim = done.
- The stepper runs your real TypeScript solution with the tracer, so visuals and code cannot disagree.
- Each preset trace is 3 to 24 steps and the first preset reaches every stage. Summarise repeated iterations.
- Pseudocode, TypeScript and Go share the same numbered stages.
- 4 edge cards. At least 2 real gotchas that genuinely apply, including language traps for TypeScript and Go.
- At least 6 cases in `cases.json` (at least 2 marked edge), with expected values you trust. For anything non-trivial, compute the expectations with an independent brute-force script kept **outside** the repo (use the scratchpad or `$TEMP`), not by running your own solution.
- A small interactive `Demo.vue` for the one idea.
- Go: `gofmt` clean, `go vet` clean, correct package name (see AUTHORING.md), idiomatic.

## Verify (from the repo root; safe to run in parallel with other agents)

```
npx tsx scripts/verify.ts --only=slug-a,slug-b
node scripts/smoke-dev.mjs slug-a slug-b --shots
npx vue-tsc --noEmit
```

Then **look at the images**: for every problem open `screenshots/<slug>-phone-watch.png`, `<slug>-desktop-watch.png`, `<slug>-phone-idea.png` and `<slug>-desktop-idea.png`. Check that the tones mean the right thing, nothing is clipped or tiny, and the picture actually explains the idea. Fix what is unclear and re-run.

Do **not** run `npm run verify`, `npm run build`, `npm run preview` or `npx playwright test`. Do **not** run any git command. Edit only inside your own `src/problems/<slug>/` folders. If you need a shared change, pick the closest existing option and say so in your report. If a problem cannot reach the standard, make it a draft as AUTHORING.md describes.

Shell tip: very long heredocs can fail with "unexpected EOF". Use the Write tool to create files.

## Final report (keep it short)

Per problem: `ready` or `draft`, variants, panel kinds used, and anything surprising. State plainly which screenshots you actually opened.
