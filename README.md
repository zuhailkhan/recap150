# Recap150

Visual explainers and spaced-repetition recap for the NeetCode 150 interview problems.

- **One interactive explainer per problem.** A one-sentence idea with a tiny demo, a step-by-step run driven by the real TypeScript solution, a brute-force vs optimal comparison, code in pseudocode, TypeScript and Go (each hidden until you ask), edge cases, gotchas and a 30-second recap.
- **Recap mode.** Daily mix, category drill and weak spots, with SM-2-style scheduling. Progress is stored in your browser (IndexedDB). No accounts, no backend, no network calls at runtime.
- **Installable and offline.** It is a PWA. After the first visit everything works without a connection.

Stack: Vue 3, TypeScript, Vite, `vite-plugin-pwa`, Zod. Tests: Vitest, Playwright, `go test`.

Progress per category is in [PROGRESS.md](PROGRESS.md) (generated). The problem list is the official NeetCode 150, imported from the data the NeetCode site is built from. Problem statements and examples are written in our own words and link to the original.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static site in dist/
npm run preview      # serve dist/ at http://localhost:4173
```

Needs Node 20+ and Go 1.22+ (Go is used by the quality checks, not by the app).

## Quality gates

```bash
npm run verify
```

runs, in order:

1. `vue-tsc` type check.
2. Unit tests (`vitest`): the SM-2 scheduler, queues and the 150-problem catalog counts.
3. `scripts/verify.ts` for every problem:
   - Zod schema check of `meta.json` and `cases.json`.
   - Pseudocode, TypeScript and Go use the same numbered stages.
   - Every TypeScript reference solution passes all its cases (run through the tracer, so tracing cannot change an answer).
   - Every preset trace is 3 to 24 steps and only uses declared stages.
   - Go tests are generated from the same `cases.json`; `gofmt`, `go vet` and `go test` must pass.
   - Rewrites `PROGRESS.md`.
4. Playwright smoke test: opens every explainer at 360px and 1440px, steps to the end, reveals each code block, and fails on any console error or sideways page scroll.

A problem that is not finished has `"status": "draft"` and is excluded from recap.

Faster loops while authoring:

```bash
npx tsx scripts/verify.ts --only=two-sum,group-anagrams    # content checks for some problems
node scripts/smoke-dev.mjs two-sum --shots                  # browser check with screenshots (own dev server)
node scripts/overflow.mjs two-sum                           # which element causes sideways scroll
node scripts/lab-shot.mjs                                   # screenshot every panel kind (also /#/lab)
```

## Add or edit a problem

Each problem is one folder, `src/problems/<slug>/`, named by its LeetCode slug. Nothing else needs editing: the app discovers the folder.

```
meta.json                 text, presets, complexity, edge cases, gotchas (validated by src/core/schema.ts)
cases.json                test cases shared by the TypeScript and Go tests
Demo.vue                  only for idea.demo = "custom"
ts/<variant>.ts           traced reference solution; also the TypeScript shown on the page
ts/<variant>.driver.ts    optional adapter for tests and traces (never shown)
go/<variant>.go           Go solution shown on the page
go/<variant>.driver.go    optional Go adapter
pseudo/<variant>.txt      pseudocode shown on the page
```

The full contract (stages, tracer hooks, panel helpers, drivers for lists, trees and design problems, compare modes, step budget, demos, drafts) is in **[docs/AUTHORING.md](docs/AUTHORING.md)**. Start from a finished problem such as `two-sum`, `valid-parentheses`, `group-anagrams` (two approaches), `reverse-linked-list` (driver) or `lru-cache` (design problem).

How the pieces fit:

- The stepper runs the real TypeScript solution with a tracer (`t.step(stage, sentence, panels)`). The shown TypeScript is the same file with the tracer lines removed, so visuals cannot disagree with the code.
- Panels are plain data (array, buckets, stack, list, tree, graph, grid, dp, intervals, heap, trie, bits) rendered by `src/visuals`. The same colour always means the same thing.
- The recap scheduler lives in `src/recap`. Every tunable number is in `src/recap/config.ts`.
- Progress export and import (file or copy-paste) is on the Backup page.

To refresh the official list: `npm run list:import`.

## Deploy

The build is a plain static site. It uses relative asset paths and hash routing, so it works from any host or sub-folder with no server rules.

```bash
npm run build
```

Upload the contents of `dist/`:

- **GitHub Pages:** publish `dist/` to the `gh-pages` branch, or use a Pages workflow that runs `npm ci && npm run build` and uploads `dist`.
- **Netlify, Cloudflare Pages, Vercel:** build command `npm run build`, output directory `dist`.
- **Any web server or bucket:** copy `dist/`. Serve over HTTPS so the service worker and install prompt work (`localhost` also works for testing).

The service worker precaches the whole app. Updates are picked up automatically on the next visit after you redeploy.

## Layout of the repo

```
src/core        schema, tracer, panel types and helpers, code utilities
src/visuals     shared visualizer components
src/components  stepper, masked code blocks, complexity widget, cards
src/recap       SM-2 engine, scheduler, store (IndexedDB), config
src/views       pages
src/problems    one folder per problem
scripts         verify, screenshots, list import
e2e, tests      Playwright and Vitest
```
