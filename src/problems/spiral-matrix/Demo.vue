<script setup lang="ts">
import { computed, ref } from 'vue'
import { grid, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Walk the four fences. Each cell shows its visit number once taken. Slide to take more cells.
const ROWS = 4
const COLS = 5
const taken = ref(0)

const path = computed(() => {
  const out: { r: number; c: number; side: string }[] = []
  let top = 0, bottom = ROWS - 1, left = 0, right = COLS - 1
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push({ r: top, c, side: 'top row' })
    top++
    for (let r = top; r <= bottom; r++) out.push({ r, c: right, side: 'right column' })
    right--
    if (top <= bottom) { for (let c = right; c >= left; c--) out.push({ r: bottom, c, side: 'bottom row' }); bottom-- }
    if (left <= right) { for (let r = bottom; r >= top; r--) out.push({ r, c: left, side: 'left column' }); left++ }
  }
  return out
})
const panel = computed(() => {
  const cells = Array.from({ length: ROWS }, () => Array<string | number>(COLS).fill(''))
  const tones = Array.from({ length: ROWS }, () => Array<Tone | null>(COLS).fill(null))
  path.value.slice(0, taken.value).forEach((p, i) => { cells[p.r][p.c] = i + 1; tones[p.r][p.c] = i === taken.value - 1 ? 'focus' : 'dim' })
  return grid(cells, { label: 'visit order (dots are not taken yet)', tones })
})
const said = computed(() => {
  if (taken.value === 0) return 'Nothing taken. The four fences sit on the outer edge.'
  const cur = path.value[taken.value - 1]
  return taken.value === path.value.length ? `All ${taken.value} cells taken. The fences have crossed.` : `Cell ${taken.value} was on the ${cur.side}. Dim cells are behind the fences, the rest is the live area.`
})
</script>

<template>
  <div class="sp">
    <PanelView :panel="panel" />
    <label class="lab">Cells taken: {{ taken }} of {{ path.length }}
      <input v-model.number="taken" class="range" type="range" min="0" :max="path.length" step="1" />
    </label>
    <p class="verdict" role="status">{{ said }}</p>
  </div>
</template>

<style scoped>
.sp { display: grid; gap: 10px; }
.lab { display: grid; gap: 6px; font-weight: 600; }
.range { width: 100%; min-height: 44px; accent-color: var(--focus-bd); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
