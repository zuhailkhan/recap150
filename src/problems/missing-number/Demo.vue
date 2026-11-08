<script setup lang="ts">
import { computed, ref } from 'vue'
import { bits } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Range 0..6. Remove one number. XOR of the whole range, XOR the numbers left: the gap falls out.
const missing = ref(4)
const full = [0, 1, 2, 3, 4, 5, 6]
const present = computed(() => full.filter((v) => v !== missing.value))
const all = full.reduce((a, v) => a ^ v, 0)
const some = computed(() => present.value.reduce((a, v) => a ^ v, 0))
const panel = computed(() =>
  bits(
    [
      { label: 'all', value: all },
      { label: 'have', value: some.value },
      { label: 'gap', value: all ^ some.value, tones: Array.from({ length: 6 }, (_, i) => (((all ^ some.value) >> (5 - i)) & 1 ? 'hit' : null)) },
    ],
    { width: 6 },
  ),
)
</script>

<template>
  <div class="mn">
    <div class="row" role="group" aria-label="Choose the missing number">
      <button v-for="v in full" :key="v" type="button" class="pick" :aria-pressed="v === missing" :aria-label="`Remove ${v}`" @click="missing = v">{{ v }}</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      XOR of the whole range is {{ all }}. XOR of the numbers present is {{ some }}. They differ by exactly <strong>{{ all ^ some }}</strong>, the number you removed.
    </p>
    <p class="muted small">Tap a number to remove it. The XOR of everything, XOR the rest, equals the removed one.</p>
  </div>
</template>

<style scoped>
.mn { display: grid; gap: 12px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.pick { min-width: 44px; min-height: 44px; font: 700 1rem var(--font-mono); color: var(--ink); background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 10px; cursor: pointer; }
.pick[aria-pressed='true'] { background: var(--miss-bg); color: var(--miss-fg); border-color: var(--miss-bd); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
