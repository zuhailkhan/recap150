<script setup lang="ts">
import { computed, ref } from 'vue'
import { bits, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// One round: a becomes a ^ b (sum without carry), b becomes the carries.
const a0 = ref(13)
const b0 = ref(11)
const rounds = ref(0)
const clamp = (v: number) => (Number.isFinite(v) ? Math.min(31, Math.max(0, Math.trunc(v))) : 0)
const state = computed(() => {
  let a = clamp(a0.value)
  let b = clamp(b0.value)
  for (let i = 0; i < rounds.value && b !== 0; i++) [a, b] = [a ^ b, (a & b) << 1]
  return { a, b }
})
const lit = (v: number, t: Tone) => Array.from({ length: 6 }, (_, i) => ((v >> (5 - i)) & 1 ? t : null))
const panel = computed(() =>
  bits(
    [
      { label: 'a', value: state.value.a },
      { label: 'b', value: state.value.b, tones: lit(state.value.b, 'hit') },
    ],
    { width: 6 },
  ),
)
const done = computed(() => state.value.b === 0)
</script>

<template>
  <div class="st">
    <div class="ins">
      <label>a <input v-model.number="a0" type="number" min="0" max="31" step="1" aria-label="a, 0 to 31" @input="rounds = 0" /></label>
      <label>b <input v-model.number="b0" type="number" min="0" max="31" step="1" aria-label="b, 0 to 31" @input="rounds = 0" /></label>
    </div>
    <PanelView :panel="panel" />
    <div class="ins">
      <button type="button" class="go" :disabled="done" @click="rounds++">One round: a ^ b, carries to b</button>
      <button type="button" class="go" @click="rounds = 0">Reset</button>
    </div>
    <p class="verdict" role="status">
      Rounds: <strong>{{ rounds }}</strong>.
      <template v-if="done">The carry is 0, so a = <strong>{{ state.a }}</strong>, which is {{ clamp(a0) }} + {{ clamp(b0) }}.</template>
      <template v-else>Carries left: {{ state.b }}. Press again.</template>
    </p>
    <p class="muted small">Green digits are the carries waiting in b. Each round pushes them one column left.</p>
  </div>
</template>

<style scoped>
.st { display: grid; gap: 12px; }
.ins { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
label { display: flex; align-items: center; gap: 8px; font-weight: 600; }
input { width: 64px; min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.go { font-family: inherit; min-height: 44px; padding: 0 14px; font-weight: 600; color: var(--ink); background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 10px; cursor: pointer; }
.go:disabled { opacity: .5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
