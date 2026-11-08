# Authoring a Recap150 problem

Each problem lives in one folder, `src/problems/<slug>/`. `<slug>` is the LeetCode slug from `src/data/neetcode150.json` (for example `two-sum`). A problem never edits shared code. Everything the app needs is discovered from the folder.

Study the three finished problems first. They are the style and structure reference:

- `src/problems/two-sum/` (one approach, array + buckets visuals)
- `src/problems/valid-parentheses/` (stack visual)
- `src/problems/group-anagrams/` (two approaches: Sorted key and Tally key)

## Folder layout

```
src/problems/<slug>/
  meta.json                 all text, presets, complexity, edge cases (validated by src/core/schema.ts)
  cases.json                test cases shared by TypeScript and Go
  Demo.vue                  only when idea.demo is "custom"
  ts/<variant>.ts           the traced reference solution. This is also the TypeScript shown on the page
  ts/<variant>.driver.ts    OPTIONAL. Test/trace adapter. Never shown
  go/<variant>.go           Go solution, shown on the page, `package <slug_with_underscores>`
  go/<variant>.driver.go    OPTIONAL. Go adapter. Never shown
  pseudo/<variant>.txt      pseudocode, shown on the page
```

`<variant>` is a short lowercase id (`sorted`, `hashmap`, `stack`). Most problems have one variant. Add a second only when the problem has a genuinely different second approach worth learning (a follow-up the interviewer asks for). Variants need tests and the same stage numbers. Only the first variant is traced in the stepper.

## Hard rules

1. **Own words.** Write the statement, examples, idea, notes and gotchas yourself. Never paste or closely paraphrase LeetCode or NeetCode text. Link to the original instead (the page does this for you).
2. **Short plain sentences.** The reader is a senior TypeScript/Go engineer who finds algorithms hard to *picture*. Explain jargon in one line (`idea.jargon`). No filler.
3. **One idea per problem.** `idea.sentence` is one sentence. The demo shows only that trick.
4. **Visuals must make the idea visible.** Pick one or two panel kinds. The same tone always means the same thing: `focus` = looking at now, `keep` = remembered/stored, `hit` = match/answer, `miss` = mismatch/rejected, `dim` = already handled.
5. **Real code drives the visuals.** The stepper runs your actual TypeScript solution with tracer hooks. No separate hand-made frames.
6. **No placeholder content.** If you cannot finish a problem, set `"status": "draft"` (see Drafts) rather than shipping filler.
7. Only pseudocode, TypeScript and Go. No runtime network calls. No new dependencies.

## Stages (the numbered badges)

Every problem has 2 to 7 numbered stages. The same numbers appear in all three languages as `[n]` inside a comment, and each step in the stepper carries a stage number.

- TypeScript and Go: `// [2] sort the letters`. Pseudocode: `# [2] sort the letters`.
- `meta.json` `variants[].stages` lists `{ n, title, note }` for every stage. The set of numbers must equal the set found in each language.
- Put each `[n]` on the line where that stage happens. A stage may appear on more than one line.
- Pseudocode, TypeScript and Go must tell the same story in the same order.

## The TypeScript file and the tracer

```ts
import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, cursor } from '../../../core/panels'

export function twoSum(nums: number[], target: number, t: Tracer = noop): number[] {
  ...
  t.step(2, `Number ${nums[i]}. I need ${need}.`, [arr(nums, { tones: cursor(nums.length, i) }), buckets(...)])
  ...
}
```

How the file becomes the displayed code: every `import` line is removed, every line that is a single complete `t.step(...)` call is removed, `, t: Tracer = noop` is removed from signatures, and `export ` is removed. So:

- Each `t.step(...)` call must be **one complete line**. Build panel data inline with the helpers from `src/core/panels.ts`.
- The tracer is the last parameter, `t: Tracer = noop`.
- Everything else in the file is shown to the reader. Keep it clean, idiomatic and short. No test-only helpers, no debugging code. Put those in the driver file.
- Do not call `t.step` before real state exists. The tracer must observe the real run.
- A tracer line must not change the algorithm's behaviour or cost.

### Panel helpers (all in `src/core/panels.ts`)

| helper | use for |
|---|---|
| `arr(items, { label, tones, pointers, window })` | arrays, two pointers, sliding window. `cursor(len, i)` and `mark(len, {i: tone})` build `tones` |
| `buckets(list, { label, keyLabel })` + `fromMap(map, hotKey)` | hash maps, frequency tables, groups |
| `stack(items, { label })` + `withTop(items, popped, tone)` | stacks, queues (list items in order) |
| `list(items, { pointers, cycleTo, links, doubly })` | linked lists (singly or doubly), cycles, random pointers |
| `tree(levelOrder, { tones, pointers })` | binary trees from a level-order array (`null` = no child). `tones`/`pointers.at` index into that array |
| `graph(nodes, edges, { tones, notes })` | graphs. Nodes without x/y sit on a circle. x,y are 0..100 |
| `grid(cells, { tones, pointers })` + `mark2(rows, cols, [[r,c,tone]])` | 2-D boards, islands, matrices |
| `dp(cells, { rowLabels, colLabels, tones })` | DP tables (1-D table = one row) |
| `intervals(spans, { marks, min, max })` | intervals on a number line |
| `heap(items, { max, tones })` | binary heaps (drawn as tree plus array) |
| `trie(words, { hot })` | tries. `hot` highlights a prefix path |
| `bits(rows, { width })` | binary digits for bit tricks |

Open `/#/lab` in the dev server to see every kind. If a panel kind genuinely cannot show your idea, do **not** edit it. Pick the closest kind and say so in your final report.

### Step budget

- Each preset trace has **3 to 24 steps** (verify enforces this). Use small inputs. Summarise repeated iterations: trace the first few and the interesting ones, then one summary step, instead of every loop turn. The cap for custom input is 60.
- Every declared stage must appear in the **first preset's** trace.
- Presets (`watch.presets`, 2 to 5): a normal case first, then the interesting edge cases (duplicates, empty, no answer, worst case). Each has a short `label`.
- Every step's `say` is one plain sentence about *what is happening and why*, using the real values.

## Drivers (when the natural signature is not JSON)

Tests and presets are JSON. If the solution takes or returns something that is not plain JSON (linked lists, trees, graph nodes, classes, multiple valid answers), keep the shown solution natural and idiomatic, and add a **driver** that converts.

`ts/<variant>.driver.ts`:

```ts
import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { reverseList, type ListNode } from './iterative'

const build = (xs: number[]): ListNode | null => ...
const flatten = (n: ListNode | null): number[] => ...

// meta.json "tsFn" names this function. It must forward the tracer.
export function reverseListDriver(vals: number[], t: Tracer = noop): number[] {
  return flatten(reverseList(build(vals), t))
}
```

`go/<variant>.driver.go` (same package, may use any imports):

```go
package reverse_linked_list

func reverseListDriver(vals []int) []int { ... build, call reverseList, flatten ... }
```

- `meta.json` `tsFn` and `goFn` name the **driver** functions when a driver exists, otherwise the solution functions.
- Type declarations (`ListNode`, `TreeNode`, `Node`) belong in the shown solution file, because the reader needs them. In a package with several variants, Go allows a type to be declared only once, so declare it in the first variant's Go file and add a one-line comment in the others.
- Design problems (a class with methods): the shown solution declares the class. The driver exposes `run(ops: string[], args: unknown[][]): unknown[]` that replays the operations and returns one result per operation (`null` for methods that return nothing). Case input is `[ops, args]`, expected is the result array.
- Problems with several valid answers (any topological order, any valid permutation): the driver returns a **canonical** result or a boolean "is this answer valid", and `cases.json` expects that.
- Floats: `"compare": "approx"` (tolerance 1e-5).
- Driver files are copied by verify and tested. They are never displayed.

## cases.json

```json
[
  {"name":"classic","input":[[2,7,11,15],9],"expected":[0,1]},
  {"name":"same value twice","input":[[3,3],6],"expected":[0,1],"edge":true}
]
```

- `input` is the argument list for the (driver) function, `expected` the result.
- At least **6 cases**, at least **2 with `"edge": true`**. Cover: empty/minimum input, single element, duplicates, negatives, the largest sensible values, and the trap the problem is known for. Include cases that would fail the most likely wrong solution.
- `compare` in meta.json: `exact` (deep equality), `sortedFlat` (sort a flat list first), `sortedGroups` (sort inside each inner list and then the lists; strings or numbers), `approx` (floats).
- `goArgs` lists the Go parameter types of the (driver) function, `goRet` its return type. Use JSON-friendly types: `int`, `string`, `bool`, `float64`, `[]int`, `[]string`, `[][]int`, `[][]string`, `[]any`, `[][]any`. Avoid `[]byte` and `[]rune` in test-facing signatures (JSON would decode them as base64 or numbers). Put byte/rune conversions in the driver or the solution.
- Missing/optional values: use `null` in JSON and `any` or a pointer in Go.
- Go test names, `go vet` and `gofmt` must be clean. Run `gofmt -w` on your Go files. Unexported function names must be unique inside the package across variants.

## meta.json

`src/core/schema.ts` is the source of truth. Copy a finished problem's `meta.json` and adapt it. Notes:

- `slug`, `title`, `category`, `difficulty` must equal the official list entry exactly.
- `statement`: 40 to 600 characters, plain words, your own.
- `example`: a small input and output drawn with panels (`input` and `output` are arrays of panels).
- `idea.demo`: `"fingerprint"`, `"complement"` or `"match"` are existing shared demos for those specific ideas only. For everything else use `"custom"` and write `Demo.vue`.
- `fast`: `vars` (define n and any other symbol), `compare` (brute vs optimal growth, picked from the enum, with plain labels and a unit), `rows` (time and space for brute force, the optimal approach and any variant, each with a one-line note), `takeaway`.
- `variants[].stages`: `n`, `title` (short), `note` (what this stage does, in this approach).
- `edges`: **exactly 4** small cards (`title`, `input`, `output`, `why`).
- `gotchas`: at least 2, with `lang` `TypeScript`, `Go` or `General`. Include the genuine language traps for this problem (JS Map with array keys, `Array.sort` default string order, truthiness of 0, Go nil vs empty slice, Go map iteration order, integer overflow, byte vs rune, slice aliasing after `append`, shared inner slices when copying 2-D data, etc.). Only list traps that really apply.
- `recap`: `pattern` tag, one-sentence `key`, `complexity`, 3 to 4 `moves`.

## Demo.vue

The "one idea" demo is a tiny interactive widget that shows only the core trick. Look at `src/demos/*.vue`. Rules: `<script setup lang="ts">`, scoped styles, theme tokens only (`var(--hit-bg)` etc., never raw colours), 44px minimum touch targets, labels on every input, works at 360px wide, no network, no timers that run forever. Reuse `Tile`, `PanelView` or panel helpers from `src/visuals` and `src/core/panels`. A new class name must not collide with the app shell. Do not use `.side`, `.top`, `.col`, `.shell`, `.grow`, `.banner`, `.skip`, `.menu`, `.brand` as class names. Keep it under about 120 lines. It must react to input (clicks, typing or sliders), not just display.

## Drafts

If you cannot finish a problem to the standard, leave it as a draft: `meta.json` containing only
`{ "slug": ..., "title": ..., "category": ..., "difficulty": ..., "status": "draft" }` and delete every other file in the folder. Drafts are excluded from recap. Say so in your report.

## Checking your work

Run these from the repo root. They are safe to run while other agents work.

```
npx tsx scripts/verify.ts --only=slug-a,slug-b      # schema, stages, traces, TypeScript cases, Go gofmt/vet/test
node scripts/smoke-dev.mjs slug-a slug-b --shots    # browser check at 360px and 1440px, writes screenshots/<slug>-<viewport>-dev.png
npx vue-tsc --noEmit                                # types, includes Demo.vue
```

Do **not** run `npm run verify`, `npm run build`, `npm run preview` or `npx playwright test`. They share one build folder and one port. Do not run git commands. The maintainer commits.

After `smoke-dev` passes, **open the screenshots and look at them**: the stepper visual, the demo, the example drawing. Check that tones mean the right thing, that nothing is clipped, and that a person who struggles to visualise this algorithm would get it from the pictures. Fix what looks confusing. Then re-run `verify`.

## What you may edit

Only files inside your own `src/problems/<slug>/` folders. Do not edit shared files (`src/core`, `src/visuals`, `src/components`, `scripts`, `docs`, `PROGRESS.md`, `package.json`). If you need a shared change, say what and why in your final report and pick the closest existing option.

## Final report

For each problem: `ready` or `draft`, the variants, which panel kinds you used, and anything surprising (a shared-code limitation, a case you could not cover, a trap worth knowing). Keep it short.
