<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { TraceResult } from '@/core/tracer'
import { parseArgs } from '@/core/parseInput'
import PanelView from '@/visuals/PanelView.vue'
import Legend from '@/visuals/Legend.vue'

const props = withDefaults(defineProps<{
  run: (args: unknown[]) => TraceResult
  presets: { label: string; args: unknown[] }[]
  inputHint?: string
  stages?: { n: number; title: string }[]
  /** false hides the free-text input (used by system design explainers, whose steps are authored data) */
  customInput?: boolean
  presetLabel?: string
}>(), { inputHint: '', stages: () => [], customInput: true, presetLabel: 'Try' })

const presetIdx = ref(0)
const trace = shallowRef<TraceResult>(props.run(props.presets[0].args))
const idx = ref(0)
const playing = ref(false)
const custom = ref('')
const customError = ref('')
let timer: ReturnType<typeof setInterval> | undefined

const last = computed(() => trace.value.frames.length - 1)
const frame = computed(() => trace.value.frames[idx.value])
const atEnd = computed(() => idx.value >= last.value)
const pct = computed(() => (last.value <= 0 ? 100 : (idx.value / last.value) * 100))
const resultText = computed(() => {
  if (trace.value.error) return `Error: ${trace.value.error}`
  return trace.value.result === undefined ? '' : JSON.stringify(trace.value.result)
})

function stop() { playing.value = false; if (timer) clearInterval(timer); timer = undefined }
function next() { if (idx.value < last.value) idx.value++; else stop() }
function back() { stop(); if (idx.value > 0) idx.value-- }
function reset() { stop(); idx.value = 0 }
function seek(e: Event) { stop(); idx.value = Number((e.target as HTMLInputElement).value) }
function play() {
  if (playing.value) return stop()
  if (atEnd.value) idx.value = 0
  playing.value = true
  timer = setInterval(next, 1100)
}
function load(args: unknown[]) { stop(); trace.value = props.run(args); idx.value = 0 }
function pick(i: number) { presetIdx.value = i; customError.value = ''; load(props.presets[i].args) }
function submitCustom() {
  const arity = props.presets[0].args.length
  const r = parseArgs(custom.value, arity)
  if (r.error) { customError.value = r.error; return }
  customError.value = ''
  presetIdx.value = -1
  load(r.args!)
}

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
  if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next() }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
  else if (e.key === ' ' && !(t && (t.tagName === 'BUTTON' || t.tagName === 'A'))) { e.preventDefault(); play() }
  else if (e.key === 'r' || e.key === 'R') reset()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); stop() })
watch(() => props.run, () => pick(0))
</script>

<template>
  <div class="stepper stage">
    <div class="viz">
      <Legend />
      <div class="panels">
        <PanelView v-for="(p, i) in frame.panels" :key="i" :panel="p" />
      </div>
    </div>

    <div class="say-area" aria-live="polite">
      <p class="say" :class="{ long: frame.say.length > 150 }"><span class="badge">{{ frame.stage }}</span><span>{{ frame.say }}</span></p>
      <p v-if="atEnd && resultText" class="result"><span class="muted small">returns</span> <code>{{ resultText }}</code></p>
      <p v-if="atEnd && trace.truncated" class="warn small">The run was cut off to keep this readable. Try a smaller input.</p>
      <p v-if="trace.error" class="warn small" role="alert">{{ trace.error }}</p>
      <ul v-if="stages.length" class="stages" aria-label="Stages in the code">
        <li v-for="s in stages" :key="s.n" :class="{ on: s.n === frame.stage }"><span class="n">{{ s.n }}</span>{{ s.title }}</li>
      </ul>
    </div>

    <div class="more">
      <div v-if="presets.length > 1" class="presets" role="group" aria-label="Example inputs">
        <span class="muted small">{{ presetLabel }}</span>
        <button v-for="(p, i) in presets" :key="p.label" type="button" class="btn sm" :aria-pressed="presetIdx === i" @click="pick(i)">{{ p.label }}</button>
      </div>
      <form v-if="customInput" class="custom" @submit.prevent="submitCustom">
        <label for="custom-in" class="small muted">Your own input. {{ inputHint }}</label>
        <div class="row">
          <input id="custom-in" v-model="custom" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type here" />
          <button class="btn" type="submit">Run</button>
        </div>
        <p v-if="customError" class="warn small" role="alert">{{ customError }}</p>
      </form>
    </div>

    <div class="transport">
      <div class="ctl">
        <button class="btn" type="button" :disabled="idx === 0" @click="back">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M10.5 3 5 8l5.5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>Back
        </button>
        <button class="btn primary" type="button" :disabled="atEnd" @click="stop(); next()">
          Next<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M5.5 3 11 8l-5.5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <button class="btn" type="button" @click="play">
          <svg v-if="!playing" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
          <svg v-else viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" /></svg>{{ playing ? 'Pause' : 'Play' }}
        </button>
        <button class="btn quiet" type="button" @click="reset">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.8-3.85M3 2.5v3h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>Reset
        </button>
      </div>
      <div class="scrub">
        <label for="scrubber" class="sr-only">Step</label>
        <input id="scrubber" type="range" min="0" :max="last" :value="idx" :style="{ '--p': pct + '%', '--n': last + 1 }" @input="seek" />
        <span class="count" role="status">Step <b>{{ idx + 1 }}</b> of {{ last + 1 }}</span>
      </div>
      <p class="keys muted small">Keys: <kbd>←</kbd> <kbd>→</kbd> step, <kbd>Space</kbd> play, <kbd>R</kbd> reset.</p>
    </div>
  </div>
</template>

<style scoped>
.stepper { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0; min-width: 0; padding: 0; overflow: clip; }
.viz { grid-row: 1; padding: 18px 18px 22px; display: grid; gap: 18px; align-content: start; min-height: 230px; min-width: 0; }
.panels { display: grid; gap: 22px; min-width: 0; }
.say-area { grid-row: 2; padding: 16px 18px; border-top: 1px solid var(--line); min-width: 0; display: grid; gap: 10px; align-content: start; }
.say { display: flex; gap: 12px; align-items: flex-start; font: 500 clamp(1.05rem, .95rem + .5vw, 1.25rem)/1.4 var(--font-ui); letter-spacing: -0.01em; margin: 0; min-height: 3.6em; }
.say .badge { margin-top: 3px; }
.say.long { font-size: 1rem; line-height: 1.45; }
.result { margin: 0; min-width: 0; }
.result code { display: inline-block; max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; vertical-align: top; background: var(--hit-bg); color: var(--hit-fg); }
.warn { color: var(--miss-fg); margin: 0; }
.stages { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 14px; }
.stages li { display: inline-flex; align-items: center; gap: 7px; min-height: 28px; font-size: .84rem; color: var(--ink-3); border-bottom: 2px solid transparent; }
.stages .n { font: 600 .72rem var(--font-mono); display: inline-grid; place-items: center; min-width: 19px; height: 19px; border-radius: 5px; border: 1px solid var(--line); }
.stages li.on { color: var(--ink); border-bottom-color: var(--ink); }
.stages li.on .n { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.more { grid-row: 3; padding: 14px 18px 18px; border-top: 1px solid var(--line); display: grid; gap: 14px; min-width: 0; }
.presets { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.custom { display: grid; gap: 6px; }
.row { display: flex; gap: 8px; }
input[type='text'] { flex: 1; min-width: 0; min-height: 44px; padding: 0 12px; font: 1rem var(--font-mono); color: var(--ink); background: var(--bg); border: 1.5px solid var(--line); border-radius: var(--radius-s); }
input[type='text']::placeholder { color: var(--ink-3); }

.transport { grid-row: 4; position: sticky; bottom: 0; z-index: 5; display: grid; gap: 10px; padding: 12px 18px 14px; border-top: 1px solid var(--line); background: color-mix(in srgb, #0c121a 94%, transparent); backdrop-filter: blur(6px); border-radius: 0 0 14px 14px; }
.ctl { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.ctl .btn { padding: 0 8px; }
.scrub { display: flex; align-items: center; gap: 14px; }
.count { font: 500 .85rem var(--font-mono); color: var(--ink-2); white-space: nowrap; }
.count b { color: var(--ink); font-weight: 700; }
.keys { margin: 0; }
@media (pointer: coarse) { .keys { display: none; } }

/* scrubber: a thin rail with one tick per step */
input[type='range'] { -webkit-appearance: none; appearance: none; flex: 1; min-width: 0; height: 44px; background: transparent; cursor: pointer; margin: 0; }
input[type='range']::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background:
  linear-gradient(90deg, var(--ink) 0 var(--p), transparent var(--p)),
  repeating-linear-gradient(90deg, #243244 0 100%); }
input[type='range']::-moz-range-track { height: 6px; border-radius: 3px; background: #243244; }
input[type='range']::-moz-range-progress { height: 6px; border-radius: 3px; background: var(--ink); }
input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; margin-top: -7px; border-radius: 50%; background: var(--ink); border: 3px solid #0c121a; box-shadow: 0 0 0 1.5px var(--ink); }
input[type='range']::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--ink); border: 3px solid #0c121a; box-shadow: 0 0 0 1.5px var(--ink); }

@media (min-width: 1000px) {
  .stepper { grid-template-columns: minmax(0, 1.35fr) minmax(320px, 1fr); grid-template-rows: auto 1fr auto; }
  .viz { grid-row: 1 / span 2; grid-column: 1; padding: 24px 26px 28px; border-right: 1px solid var(--line); }
  .say-area { grid-row: 1; grid-column: 2; border-top: 0; padding: 24px 24px 12px; }
  .more { grid-row: 2; grid-column: 2; border-top: 0; padding: 4px 24px 24px; align-content: start; }
  .transport { grid-row: 3; grid-column: 1 / -1; position: static; grid-template-columns: auto 1fr auto; align-items: center; gap: 22px; padding: 12px 24px; background: #0a1017; }
  .ctl { grid-template-columns: repeat(4, auto); }
  .ctl .btn { padding: 0 16px; }
  .keys { grid-column: 3; grid-row: 1; }
}
</style>
