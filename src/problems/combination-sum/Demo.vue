<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Candidates 2, 3, 5 and target 8. Each pick may repeat, but never look back to an earlier candidate.
const cands = [2, 3, 5]
const target = 8
const picks = ref<number[]>([]) // indexes into cands
const sum = computed(() => picks.value.reduce((s, i) => s + cands[i], 0))
const left = computed(() => target - sum.value)
const start = computed(() => picks.value[picks.value.length - 1] ?? 0)
const why = (i: number) => (i < start.value ? 'earlier candidate: no looking back' : cands[i] > left.value ? 'too big' : '')
const done = computed(() => left.value === 0)
const pathPanel = computed(() => arr(picks.value.map((i) => cands[i]), { label: `path (still need ${left.value})`, tones: picks.value.map(() => (done.value ? 'hit' : 'keep')) }))
const say = computed(() => {
  if (done.value) return `Left is 0: ${picks.value.map((i) => cands[i]).join(' + ')} = ${target}. Save it, then undo to look for others.`
  const open = cands.filter((_, i) => !why(i))
  return open.length ? `Still need ${left.value}. You may pick: ${open.join(', ')}.` : `Still need ${left.value} and nothing fits. Dead end: undo.`
})
</script>

<template>
  <div class="dcs">
    <div class="keys" role="group" aria-label="Pick the next candidate">
      <button v-for="(c, i) in cands" :key="i" class="btn" type="button" :disabled="done || !!why(i)" :aria-label="`Pick ${c}`" @click="picks.push(i)">{{ c }}</button>
      <button class="btn quiet" type="button" :disabled="!picks.length" @click="picks.pop()">Undo</button>
      <button class="btn quiet" type="button" :disabled="!picks.length" @click="picks = []">Clear</button>
    </div>
    <PanelView :panel="pathPanel" />
    <p class="verdict" :class="{ ok: done }" role="status">{{ say }}</p>
    <p class="muted small">Target is {{ target }}. A grey button is blocked: {{ cands.map((c, i) => why(i) ? `${c} is ${why(i)}` : '').filter(Boolean).join('; ') || 'none right now' }}.</p>
  </div>
</template>

<style scoped>
.dcs { display: grid; gap: 10px; }
.keys { display: flex; flex-wrap: wrap; gap: 8px; }
.keys .btn { min-width: 44px; min-height: 44px; font-family: var(--font-mono); font-size: 1.1rem; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
