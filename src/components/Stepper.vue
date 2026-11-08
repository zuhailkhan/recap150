<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { TraceResult } from '@/core/tracer'
import { parseArgs } from '@/core/parseInput'
import PanelView from '@/visuals/PanelView.vue'
import Legend from '@/visuals/Legend.vue'

const props = defineProps<{
  run: (args: unknown[]) => TraceResult
  presets: { label: string; args: unknown[] }[]
  inputHint: string
  stages: { n: number; title: string }[]
}>()

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
const pct = computed(() => (last.value <= 0 ? 100 : Math.round(((idx.value + 1) / (last.value + 1)) * 100)))
const resultText = computed(() => {
  if (trace.value.error) return `Error: ${trace.value.error}`
  return trace.value.result === undefined ? '' : JSON.stringify(trace.value.result)
})

function stop() { playing.value = false; if (timer) clearInterval(timer); timer = undefined }
function next() { if (idx.value < last.value) idx.value++; else stop() }
function back() { stop(); if (idx.value > 0) idx.value-- }
function reset() { stop(); idx.value = 0 }
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
  <div class="stepper">
    <div class="visual card">
      <Legend />
      <div class="panels">
        <PanelView v-for="(p, i) in frame.panels" :key="i" :panel="p" />
      </div>
    </div>

    <div class="side">
      <div class="narr card" aria-live="polite">
        <div class="count">Step {{ idx + 1 }} of {{ last + 1 }}</div>
        <div class="bar" role="progressbar" aria-label="Progress through the run" :aria-valuenow="idx + 1" aria-valuemin="1" :aria-valuemax="last + 1"><span :style="{ width: pct + '%' }"></span></div>
        <p class="say"><span class="badge">{{ frame.stage }}</span><span>{{ frame.say }}</span></p>
        <p v-if="atEnd && resultText" class="result"><span class="muted small">Returns</span> <code>{{ resultText }}</code></p>
        <p v-if="atEnd && trace.truncated" class="warn small">The run was cut off to keep this readable. Try a smaller input.</p>
        <p v-if="trace.error" class="warn small" role="alert">{{ trace.error }}</p>
        <ul class="stages" aria-label="Stages in the code">
          <li v-for="s in stages" :key="s.n" :class="{ on: s.n === frame.stage }"><span class="badge sm">{{ s.n }}</span>{{ s.title }}</li>
        </ul>
      </div>

      <div class="ctl">
        <button class="btn" type="button" :disabled="idx === 0" @click="back">Back</button>
        <button class="btn primary" type="button" :disabled="atEnd" @click="stop(); next()">Next</button>
        <button class="btn" type="button" @click="play">{{ playing ? 'Pause' : 'Play' }}</button>
        <button class="btn quiet" type="button" @click="reset">Reset</button>
      </div>
      <p class="keys muted small">Keys: <kbd>←</kbd> <kbd>→</kbd> step, <kbd>Space</kbd> play, <kbd>R</kbd> reset.</p>

      <div class="presets" role="group" aria-label="Example inputs">
        <span class="muted small">Examples</span>
        <button v-for="(p, i) in presets" :key="p.label" type="button" class="btn sm" :class="{ primary: presetIdx === i }" :aria-pressed="presetIdx === i" @click="pick(i)">{{ p.label }}</button>
      </div>
      <form class="custom" @submit.prevent="submitCustom">
        <label for="custom-in" class="small muted">Your own input. {{ inputHint }}</label>
        <div class="row">
          <input id="custom-in" v-model="custom" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type here" />
          <button class="btn" type="submit">Run</button>
        </div>
        <p v-if="customError" class="warn small" role="alert">{{ customError }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.stepper { display: grid; gap: 14px; min-width: 0; }
.side { display: grid; gap: 12px; align-content: start; min-width: 0; }
@media (min-width: 1000px) { .stepper { grid-template-columns: minmax(0, 1.25fr) minmax(320px, 1fr); gap: 20px; align-items: start; } .visual { position: sticky; top: 16px; } }
.visual { display: grid; gap: 16px; min-height: 220px; align-content: start; }
.panels { display: grid; gap: 18px; min-width: 0; }
.count { font-weight: 700; margin-bottom: 8px; }
.bar { height: 8px; border-radius: 999px; background: var(--surface-2); overflow: hidden; margin-bottom: 14px; }
.bar span { display: block; height: 100%; background: var(--accent); transition: width .2s; }
.say { display: flex; gap: 10px; align-items: flex-start; font-size: 1.05rem; margin: 0 0 10px; min-height: 3.4em; }
.result { margin: 0 0 10px; min-width: 0; }
.result code { display: inline-block; max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; vertical-align: top; }
.warn { color: var(--miss-fg); margin: 0 0 8px; }
.stages { list-style: none; margin: 0; padding: 10px 0 0; border-top: 1px solid var(--line); display: flex; flex-wrap: wrap; gap: 6px; }
.stages li { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px 3px 6px; border-radius: 999px; font-size: .82rem; color: var(--ink-2); border: 1px solid var(--line); }
.stages li.on { background: var(--accent-soft); color: var(--ink); border-color: var(--accent); font-weight: 600; }
.ctl { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; position: sticky; bottom: 8px; z-index: 5; padding: 8px; margin: 0 -8px; background: color-mix(in srgb, var(--bg) 90%, transparent); border-radius: 14px; backdrop-filter: blur(4px); }
@media (min-width: 1000px) { .ctl { position: static; padding: 0; margin: 0; background: none; backdrop-filter: none; } }
.keys { margin: 0; }
@media (pointer: coarse) { .keys { display: none; } }
.presets { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.custom { display: grid; gap: 6px; }
.row { display: flex; gap: 8px; }
input { flex: 1; min-width: 0; min-height: 44px; padding: 0 12px; font: 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
</style>
