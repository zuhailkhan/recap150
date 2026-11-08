<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Only the heads can be next. Tap the button: the smallest head moves to the answer.
const lists = [[1, 4, 5], [1, 3, 4], [2, 6]]
const used = ref([0, 0, 0])
const out = ref<number[]>([])

const heads = computed(() => lists.map((l, i) => (used.value[i] < l.length ? l[used.value[i]] : null)))
const best = computed(() => {
  let b = -1
  heads.value.forEach((h, i) => { if (h !== null && (b === -1 || h < (heads.value[b] as number))) b = i })
  return b
})
const take = () => {
  const b = best.value
  if (b === -1) return
  out.value = [...out.value, lists[b][used.value[b]]]
  used.value = used.value.map((u, i) => (i === b ? u + 1 : u))
}
const reset = () => { used.value = [0, 0, 0]; out.value = [] }
const panels = computed(() =>
  lists.map((l, i) => list(l, { label: `list ${i + 1}`, tones: l.map((_, k) => (k < used.value[i] ? 'dim' : k === used.value[i] ? (i === best.value ? 'hit' : 'keep') : null)) })),
)
const answer = computed(() => list(out.value, { label: 'answer so far', tones: out.value.map(() => 'hit') }))
</script>

<template>
  <div class="d">
    <PanelView v-for="(p, i) in panels" :key="i" :panel="p" />
    <PanelView :panel="answer" />
    <div class="row">
      <button class="btn go" :disabled="best === -1" @click="take">Take the smallest head</button>
      <button class="btn" @click="reset">Start over</button>
    </div>
    <p class="verdict" role="status">
      <template v-if="best === -1">All lists are used up. The answer is sorted.</template>
      <template v-else>Heads now: {{ heads.filter((h) => h !== null).join(', ') }}. The smallest, {{ heads[best] }}, is green. Nothing deeper in a list can beat its head.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.go { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.btn:disabled { opacity: 0.5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
