<script setup lang="ts">
import { computed, ref } from 'vue'
import { grid } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Every cell shows its box number. Pick a cell to see its row, column and box.
const r = ref(4)
const c = ref(7)
const box = (i: number, j: number) => Math.floor(i / 3) * 3 + Math.floor(j / 3)
const panel = computed(() => grid(
  Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => box(i, j))),
  { label: 'each cell shows its box number', tones: Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => (i === r.value && j === c.value ? 'focus' : box(i, j) === box(r.value, c.value) ? 'hit' : i === r.value || j === c.value ? 'keep' : null))) },
))
</script>

<template>
  <div class="vsd">
    <label class="fld">Row r: <strong>{{ r }}</strong> <input v-model.number="r" type="range" min="0" max="8" aria-label="Row r" /></label>
    <label class="fld">Column c: <strong>{{ c }}</strong> <input v-model.number="c" type="range" min="0" max="8" aria-label="Column c" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      box = floor({{ r }}/3)*3 + floor({{ c }}/3) = {{ Math.floor(r / 3) * 3 }} + {{ Math.floor(c / 3) }} = <strong>{{ box(r, c) }}</strong>.
      This cell must not repeat a digit in row {{ r }}, column {{ c }} or box {{ box(r, c) }}.
    </p>
    <p class="muted small">Move the sliders. The cell, its row and column, and its whole box are lit.</p>
  </div>
</template>

<style scoped>
.vsd { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
