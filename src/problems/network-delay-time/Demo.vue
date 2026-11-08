<script setup lang="ts">
import { computed, ref } from 'vue'
import { graph, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// You choose which node to finish next. Finish the closest one and its time is safe. Finish another and it may be wrong.
const links: [number, number, number][] = [[1, 2, 2], [1, 3, 6], [2, 3, 1], [2, 4, 7], [3, 4, 2], [4, 5, 1]]
const spots = [[8, 50], [34, 12], [34, 88], [64, 50], [92, 50]]
const done = ref<Record<number, number>>({ 1: 0 })
const note = ref('Node 1 is finished at 0. Pick a node to finish next.')

// What we know now: the best time through nodes that are finished.
const known = computed(() => {
  const out: Record<number, number> = {}
  for (const [a, b, w] of links) if (a in done.value && !(b in done.value)) out[b] = Math.min(out[b] ?? Infinity, done.value[a] + w)
  return out
})
// The true shortest times, for checking your choice.
const truth = (() => {
  const d = [Infinity, 0, Infinity, Infinity, Infinity, Infinity]
  for (let r = 0; r < 5; r++) for (const [a, b, w] of links) d[b] = Math.min(d[b], d[a] + w)
  return d
})()

const pick = (v: number) => {
  const time = known.value[v]
  const best = Math.min(...Object.values(known.value))
  done.value = { ...done.value, [v]: time }
  note.value = time === truth[v]
    ? `Node ${v} finished at ${time}${time === best ? ', the smallest known time. Safe.' : ', and it happens to be right, but you were lucky.'}`
    : `Node ${v} finished at ${time}, but the real time is ${truth[v]}. It was not the closest unfinished node, so a shorter route was still hiding.`
}
const reset = () => { done.value = { 1: 0 }; note.value = 'Node 1 is finished at 0. Pick a node to finish next.' }

const panel = computed(() => {
  const tones: Record<string, Tone> = {}
  const notes: Record<string, string> = {}
  for (let v = 1; v <= 5; v++) {
    if (v in done.value) { tones[v] = done.value[v] === truth[v] ? 'hit' : 'miss'; notes[v] = String(done.value[v]) }
    else if (v in known.value) { tones[v] = 'keep'; notes[v] = String(known.value[v]) }
    else notes[v] = 'inf'
  }
  return graph(spots.map(([x, y], i) => ({ id: String(i + 1), x, y })), links.map(([a, b, w]) => ({ from: String(a), to: String(b), weight: w, directed: true })), { tones, notes, label: 'number under a node = time we know for it' })
})
const choices = computed(() => Object.keys(known.value).map(Number))
</script>

<template>
  <div class="ndd">
    <PanelView :panel="panel" />
    <div class="row">
      <button v-for="v in choices" :key="v" class="btn" @click="pick(v)">Finish node {{ v }} (time {{ known[v] }})</button>
      <button class="btn" @click="reset">Start over</button>
    </div>
    <p class="verdict" role="status">{{ note }}</p>
  </div>
</template>

<style scoped>
.ndd { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
