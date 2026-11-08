<script setup lang="ts">
import { computed, ref } from 'vue'
import { buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Type numbers. Each one is filed in the slot numbered by how often it appears.
const text = ref('1, 1, 1, 2, 2, 3, 4, 4, 4, 4')
const k = ref(2)
const nums = computed(() => text.value.split(/[\s,]+/).filter((s) => s !== '' && Number.isFinite(Number(s))).map(Number).slice(0, 30))
const slots = computed(() => {
  const count = new Map<number, number>()
  for (const x of nums.value) count.set(x, (count.get(x) ?? 0) + 1)
  const out: number[][] = Array.from({ length: nums.value.length + 1 }, () => [])
  for (const [x, c] of count) out[c].push(x)
  return out
})
const chosen = computed(() => {
  const got: number[] = []
  for (let f = slots.value.length - 1; f >= 1 && got.length < k.value; f--) got.push(...slots.value[f])
  return got.slice(0, k.value)
})
const panel = computed(() => buckets(
  slots.value.map((xs, f) => ({ key: String(f), items: xs, tone: xs.length && xs.every((x) => chosen.value.includes(x)) ? 'hit' as const : undefined })).slice(1),
  { label: 'slots, highest read first', keyLabel: 'appears this many times', empty: 'type some numbers' },
))
</script>

<template>
  <div class="tkd">
    <label class="fld">Numbers <input v-model="text" type="text" inputmode="text" autocomplete="off" aria-label="Numbers, separated by commas" /></label>
    <label class="fld">k = {{ k }} <input v-model.number="k" type="range" min="1" max="5" aria-label="k, how many values to keep" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">Top {{ k }}: <strong>{{ chosen.join(', ') || 'none' }}</strong>. Green slots are read first, from the highest slot down.</p>
    <p class="muted small">Change the numbers or k. The slot number is the count, so the highest slot is read first.</p>
  </div>
</template>

<style scoped>
.tkd { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input[type='text'] { min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.fld input[type='range'] { min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
