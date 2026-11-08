<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, grid } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// One number (the flat index) is all you need. Row = index / cols, column = index % cols.
const matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
const cols = matrix[0].length
const flat = matrix.flat()
const idx = ref(6)
const row = computed(() => Math.floor(idx.value / cols))
const col = computed(() => idx.value % cols)
const flatPanel = computed(() => arr(flat, { label: 'flattened line', tones: flat.map((_, i) => (i === idx.value ? 'focus' : null)), pointers: [{ name: 'index', at: idx.value, tone: 'focus' }] }))
const gridPanel = computed(() => grid(matrix, { label: 'matrix', tones: matrix.map((cells, y) => cells.map((_, x) => (y === row.value && x === col.value ? 'focus' : null))), pointers: [{ r: row.value, c: col.value, name: 'here', tone: 'focus' }] }))
</script>

<template>
  <div class="mx">
    <label class="ctl">Flat index: <b>{{ idx }}</b>
      <input v-model.number="idx" type="range" min="0" :max="flat.length - 1" step="1" />
    </label>
    <PanelView :panel="flatPanel" />
    <PanelView :panel="gridPanel" />
    <p class="say" role="status">Row = {{ idx }} / {{ cols }} = <b>{{ row }}</b> (rounded down). Column = {{ idx }} mod {{ cols }} = <b>{{ col }}</b>. Value <b>{{ flat[idx] }}</b>.</p>
  </div>
</template>

<style scoped>
.mx { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; min-height: 44px; }
.ctl input { width: 100%; min-height: 32px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
</style>
