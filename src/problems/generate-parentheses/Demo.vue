<script setup lang="ts">
import { computed, ref } from 'vue'
import PanelView from '@/visuals/PanelView.vue'

// Build a string for n = 3. Each button is only enabled when the rule allows it.
const n = 3
const path = ref<string[]>([])
const opened = computed(() => path.value.filter((c) => c === '(').length)
const closed = computed(() => path.value.length - opened.value)
const canOpen = computed(() => opened.value < n)
const canClose = computed(() => closed.value < opened.value)
const done = computed(() => path.value.length === 2 * n)
const panel = computed(() => ({
  kind: 'stack' as const,
  label: 'string so far (stack)',
  items: path.value,
  tones: path.value.map((_, i) => (done.value ? ('hit' as const) : i === path.value.length - 1 ? ('focus' as const) : null)),
  empty: 'empty',
}))
const why = computed(() => {
  if (done.value) return `Complete: ${path.value.join('')}. Undo to try a different branch.`
  const open = canOpen.value ? 'Open is allowed: only ' + opened.value + ' of ' + n + ' used.' : 'Open is blocked: all ' + n + ' are used.'
  const close = canClose.value ? 'Close is allowed: ' + (opened.value - closed.value) + ' still open.' : 'Close is blocked: nothing is open.'
  return `${open} ${close}`
})
</script>

<template>
  <div class="gp">
    <div class="keys" role="group" aria-label="Choose the next bracket">
      <button class="btn" type="button" :disabled="!canOpen" aria-label="Add opening bracket" @click="path.push('(')">(</button>
      <button class="btn" type="button" :disabled="!canClose" aria-label="Add closing bracket" @click="path.push(')')">)</button>
      <button class="btn quiet" type="button" :disabled="!path.length" @click="path.pop()">Undo</button>
      <button class="btn quiet" type="button" :disabled="!path.length" @click="path = []">Clear</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ ok: done }" role="status">{{ why }}</p>
    <p class="muted small">n is 3. Every string you can finish here is valid, and no valid string is out of reach.</p>
  </div>
</template>

<style scoped>
.gp { display: grid; gap: 10px; }
.keys { display: flex; flex-wrap: wrap; gap: 8px; }
.keys .btn { font-family: var(--font-mono); font-size: 1.2rem; min-width: 44px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
