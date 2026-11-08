<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A sorted pile stands in for the heap: the heaviest two are always at the front.
const start = [2, 7, 4, 1, 8, 1]
const pile = ref([...start].sort((a, b) => b - a))
const last = ref<string>('Tap the button to smash the two heaviest stones.')

const finished = computed(() => pile.value.length < 2)
const smash = () => {
  if (finished.value) return
  const [y, x, ...rest] = pile.value
  const left = y - x
  pile.value = (left > 0 ? [...rest, left] : rest).sort((a, b) => b - a)
  last.value = left > 0 ? `${y} and ${x} smash. ${left} survives and goes back in.` : `${y} and ${x} are equal. Both vanish.`
}
const reset = () => { pile.value = [...start].sort((a, b) => b - a); last.value = 'Tap the button to smash the two heaviest stones.' }

const panel = computed(() => arr(pile.value, { label: 'stones, heaviest first', tones: pile.value.map((_, i) => (finished.value ? 'hit' : i < 2 ? 'focus' : null)) }))
</script>

<template>
  <div class="d">
    <PanelView :panel="panel" />
    <div class="row">
      <button class="btn go" :disabled="finished" @click="smash">Smash the two heaviest</button>
      <button class="btn" @click="reset">Start over</button>
    </div>
    <p class="verdict" role="status">
      <template v-if="finished">{{ pile.length ? `Done. The last stone weighs ${pile[0]}.` : 'Done. No stones left, so the answer is 0.' }}</template>
      <template v-else>{{ last }}</template>
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
